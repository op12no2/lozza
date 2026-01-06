class Knob {

  constructor(rootContainer, knobId, options = {}) {
        const div = document.createElement('div');
        div.id = knobId;
        div.className = 'knob-container';
        rootContainer.appendChild(div);
        this.container = document.getElementById(knobId);
        this.label = options.label || 'PARAM';
        this.min = options.min ?? 0;
        this.max = options.max ?? 127;
        this.steps = options.steps || null; // e.g. [0, 10, 20] or [0, 1, 2]
        this.stepLabels = options.stepLabels || null; // e.g. ['Low', 'Med', 'High']
        this.defaultValue = options.defaultValue ?? this.min;
        this.value = options.value ?? this.defaultValue;
        this.indicatorColor = options.indicatorColor || '#555';
        this.size = options.size || 60;
        this.sensitivity = options.sensitivity ?? 1.8/127 * (this.max - this.min); // pixels per unit
        this.onChange = options.onChange || (() => {});

        this.isDragging = false;
        this.dragStartY = 0;
        this.dragStartValue = 0;

        this.render();
        this.attachEvents();
      }

      snapToStep(value) {
        if (!this.steps) {
          return value;
        }

        // Find closest step
        let closest = this.steps[0];
        let minDiff = Math.abs(value - closest);

        for (let i = 1; i < this.steps; i++) {
          const diff = Math.abs(value - this.steps[i]);
          if (diff < minDiff) {
            minDiff = diff;
            closest = this.steps[i];
          }
        }

        return closest;
      }

      getDisplayValue() {
        const val = Math.round(this.value);

        // If we have step labels, show the corresponding label
        if (this.steps && this.stepLabels) {
          const stepIndex = this.steps.indexOf(val);
          if (stepIndex >= 0 && stepIndex < this.stepLabels.length) {
            return this.stepLabels[stepIndex];
          }
        }
        else if (this.stepLabels) {  // assume 1:1
          return this.stepLabels[val];
        }


        return val;
      }

      render() {
        const svg = this.createKnobSVG();

        this.container.innerHTML = `
          <div class="knob-label">${this.label}</div>
          ${svg}
          <div class="knob-value">${this.getDisplayValue()}</div>
        `;

        this.svgElement = this.container.querySelector('.knob-svg');
        this.valueDisplay = this.container.querySelector('.knob-value');
        this.indicator = this.container.querySelector('.knob-indicator');
      }

      createKnobSVG() {
        const size = this.size;
        const center = size / 2;
        const outerRadius = size / 2 - 2;
        const innerRadius = outerRadius * 0.85;

        // Calculate angle for current value
        // 0� = north/up (12 o'clock)
        // -160� = 7 o'clock (min), +160� = 5 o'clock (max)
        const minAngle = -160;
        const maxAngle = 160;
        const angleRange = maxAngle - minAngle; // 320 degrees
        const valuePercent = (this.value - this.min) / (this.max - this.min);
        const currentAngle = minAngle + (angleRange * valuePercent);
        const centerDotColor = '#555555';

        // Create arc path for indicator
        const arcPath = this.createArcPath(center, innerRadius + 3, minAngle, currentAngle);

        return `
          <svg class="knob-svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
            <defs>
              <!-- Outer shadow -->
              <radialGradient id="outerShadow">
                <stop offset="0%" style="stop-color:#000;stop-opacity:0.3" />
                <stop offset="100%" style="stop-color:#000;stop-opacity:0" />
              </radialGradient>

              <!-- Knob body gradient (dark metal) -->
              <radialGradient id="knobBody" cx="40%" cy="40%">
                <stop offset="0%" style="stop-color:#3a3a3a" />
                <stop offset="70%" style="stop-color:#252525" />
                <stop offset="100%" style="stop-color:#1a1a1a" />
              </radialGradient>

              <!-- Bevel highlight -->
              <radialGradient id="bevelHighlight" cx="35%" cy="35%">
                <stop offset="0%" style="stop-color:#555;stop-opacity:0.9" />
                <stop offset="50%" style="stop-color:#333;stop-opacity:0.5" />
                <stop offset="100%" style="stop-color:#222;stop-opacity:0" />
              </radialGradient>

              <!-- Top surface gradient -->
              <radialGradient id="topSurface" cx="40%" cy="40%">
                <stop offset="0%" style="stop-color:#404040" />
                <stop offset="100%" style="stop-color:#2a2a2a" />
              </radialGradient>
            </defs>

            <!-- Outer shadow circle -->
            <circle cx="${center}" cy="${center}" r="${outerRadius + 2}" fill="url(#outerShadow)" />

            <!-- Main knob body -->
            <circle cx="${center}" cy="${center}" r="${outerRadius}" fill="url(#knobBody)" />

            <!-- Bevel edge highlight -->
            <circle cx="${center}" cy="${center}" r="${outerRadius}" fill="url(#bevelHighlight)" />

            <!-- Inner top surface -->
            <circle cx="${center}" cy="${center}" r="${innerRadius}" fill="url(#topSurface)" />

            <!-- Value indicator arc -->
            <path class="knob-indicator" d="${arcPath}"
                  fill="none"
                  stroke="${this.indicatorColor}"
                  stroke-width="3"
                  stroke-linecap="round" />

            <!-- Center dot -->
            <circle cx="${center}" cy="${center}" r="2" fill="${centerDotColor}" />

            <!-- Pointer line -->
            ${this.createPointerLine(center, innerRadius * 0.4, innerRadius * 0.75, currentAngle)}
          </svg>
        `;
      }

      createArcPath(center, radius, startAngle, endAngle) {
        // Handle the case where we're at minimum (no arc to draw)
        if (endAngle <= startAngle) {
          return '';
        }

        const start = this.polarToCartesian(center, center, radius, endAngle);
        const end = this.polarToCartesian(center, center, radius, startAngle);
        const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

        return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
      }

      createPointerLine(center, innerLen, outerLen, angle) {
        const inner = this.polarToCartesian(center, center, innerLen, angle);
        const outer = this.polarToCartesian(center, center, outerLen, angle);

        return `<line x1="${inner.x}" y1="${inner.y}" x2="${outer.x}" y2="${outer.y}"
                      stroke="#666" stroke-width="2" stroke-linecap="round" />`;
      }

      polarToCartesian(centerX, centerY, radius, angleInDegrees) {
        // 0 degrees = north/up (12 o'clock)
        // Positive angles go clockwise
        const angleInRadians = angleInDegrees * Math.PI / 180.0;
        return {
          x: centerX + (radius * Math.sin(angleInRadians)),
          y: centerY - (radius * Math.cos(angleInRadians))
        };
      }

      attachEvents() {
        this.container.addEventListener('mousedown', (e) => this.onPointerDown(e));
        this.container.addEventListener('dblclick', (e) => this.onDoubleClick(e));
        document.addEventListener('mousemove', (e) => this.onPointerMove(e));
        document.addEventListener('mouseup', () => this.onPointerUp());
      }

      onPointerDown(e) {
        e.preventDefault();
        this.isDragging = true;
        this.dragStartY = e.clientY;
        this.dragStartValue = this.value;
        this.container.style.cursor = 'grabbing';
      }

      onDoubleClick(e) {
        e.preventDefault();
        this.value = this.defaultValue;
        this.updateDisplay();
        this.onChange(Math.round(this.value));
      }

      onPointerMove(e) {
        if (!this.isDragging) return;

        const deltaY = this.dragStartY - e.clientY; // Inverted: drag up = increase
        const valueChange = deltaY * this.sensitivity;

        let newValue = this.dragStartValue + valueChange;

        // Snap to step if steps are defined
        newValue = this.snapToStep(newValue);

        // Clamp to exact min/max bounds
        if (newValue <= this.min) {
          newValue = this.min;
        }
        else if (newValue >= this.max) {
          newValue = this.max;
        }

        this.value = newValue;
        this.updateDisplay();
        this.onChange(Math.round(this.value));
      }

      onPointerUp() {
        if (this.isDragging) {
          this.isDragging = false;
          this.container.style.cursor = 'pointer';
        }
      }

      updateDisplay() {
        this.valueDisplay.textContent = this.getDisplayValue();

        // Update indicator arc and pointer
        const minAngle = -160;
        const maxAngle = 160;
        const angleRange = maxAngle - minAngle;
        const valuePercent = (this.value - this.min) / (this.max - this.min);
        const currentAngle = minAngle + (angleRange * valuePercent);

        const center = this.size / 2;
        const innerRadius = (this.size / 2 - 2) * 0.85;
        const arcPath = this.createArcPath(center, innerRadius + 3, minAngle, currentAngle);

        this.indicator.setAttribute('d', arcPath);

        // Update pointer (find and update the line element)
        const line = this.svgElement.querySelector('line');
        const inner = this.polarToCartesian(center, center, innerRadius * 0.4, currentAngle);
        const outer = this.polarToCartesian(center, center, innerRadius * 0.75, currentAngle);
        line.setAttribute('x1', inner.x);
        line.setAttribute('y1', inner.y);
        line.setAttribute('x2', outer.x);
        line.setAttribute('y2', outer.y);
      }

      setValue(newValue) {
        this.value = Math.max(this.min, Math.min(this.max, newValue));
        this.updateDisplay();
      }
    }

