class Button {

  constructor(options = {}) {
    this.size = options.size || 30;
    this.icon = options.icon || 'cog';
    this.color = options.color || '#4aff4a';
    this.onColor = this.color;
    this.offColor = options.offColor || '#555';
    this.onClick = options.onClick || (() => {});

    this.isEnabled = true;
    this.isOn = false;

    this.element = null;
    this.iconElement = null;
  }

  render() {
    const btnId = `btn-${Math.random().toString(36).substr(2, 9)}`;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', this.size);
    svg.setAttribute('height', this.size);
    svg.setAttribute('viewBox', `0 0 ${this.size} ${this.size}`);
    svg.classList.add('hardware-btn');

    svg.innerHTML = `
      <defs>
        <radialGradient id="btnBody-${btnId}" cx="40%" cy="40%">
          <stop offset="0%" style="stop-color:#3a3a3a" />
          <stop offset="70%" style="stop-color:#252525" />
          <stop offset="100%" style="stop-color:#1a1a1a" />
        </radialGradient>

        <radialGradient id="btnHighlight-${btnId}" cx="35%" cy="35%">
          <stop offset="0%" style="stop-color:#555;stop-opacity:0.7" />
          <stop offset="100%" style="stop-color:#222;stop-opacity:0" />
        </radialGradient>
      </defs>

      <circle cx="${this.size/2}" cy="${this.size/2}" r="${this.size/2 - 2}"
              fill="url(#btnBody-${btnId})" />
      <circle cx="${this.size/2}" cy="${this.size/2}" r="${this.size/2 - 2}"
              fill="url(#btnHighlight-${btnId})" />

      ${this.getIconSVG()}
    `;

    this.element = svg;
    this.iconElement = svg.querySelector('.btn-icon');

    this.attachEvents();
    this.updateVisualState();

    return this.element;
  }

  getIconSVG() {
    const center = this.size / 2;
    const scale = this.size / 30;

    switch(this.icon) {
      case 'cog':
        return this.createCogIcon(center, scale);
      case 'play':
        return this.createPlayIcon(center, scale);
      case 'pause':
        return this.createPauseIcon(center, scale);
      case 'stop':
        return this.createStopIcon(center, scale);
      case 'midi':
        return this.createMidiIcon(center, scale);
      case 'help':
        return this.createHelpIcon(center, scale);
      case 'download':
        return this.createDownloadIcon(center, scale);
      case 'open':
        return this.createOpenIcon(center, scale);
      default:
        return '';
    }
  }

  createCogIcon(center, scale) {
    // Cog with 8 teeth
    const innerRadius = 3.5 * scale;
    const outerRadius = 6.5 * scale;
    const toothWidth = 0.6 * scale;
    const numTeeth = 8;

    let path = '';

    for (let i = 0; i < numTeeth; i++) {
      const angle1 = (i * Math.PI * 2 / numTeeth) - toothWidth / outerRadius;
      const angle2 = (i * Math.PI * 2 / numTeeth) + toothWidth / outerRadius;

      const x1 = center + Math.cos(angle1) * innerRadius;
      const y1 = center + Math.sin(angle1) * innerRadius;
      const x2 = center + Math.cos(angle1) * outerRadius;
      const y2 = center + Math.sin(angle1) * outerRadius;
      const x3 = center + Math.cos(angle2) * outerRadius;
      const y3 = center + Math.sin(angle2) * outerRadius;
      const x4 = center + Math.cos(angle2) * innerRadius;
      const y4 = center + Math.sin(angle2) * innerRadius;

      if (i === 0) {
        path = `M ${x1} ${y1}`;
      }

      path += ` L ${x2} ${y2} L ${x3} ${y3} L ${x4} ${y4}`;

      if (i < numTeeth - 1) {
        const nextAngle = ((i + 1) * Math.PI * 2 / numTeeth) - toothWidth / outerRadius;
        const nx = center + Math.cos(nextAngle) * innerRadius;
        const ny = center + Math.sin(nextAngle) * innerRadius;
        path += ` A ${innerRadius} ${innerRadius} 0 0 1 ${nx} ${ny}`;
      }
    }

    path += ' Z';

    return `
      <g class="btn-icon">
        <path d="${path}" fill="${this.offColor}" stroke="none" />
        <circle cx="${center}" cy="${center}" r="${2.2 * scale}" fill="#1a1a1a" />
      </g>
    `;
  }

  createPlayIcon(center, scale) {
    const offset = 0.5 * scale;
    return `
      <path class="btn-icon"
            d="M ${center - 4*scale + offset} ${center - 6*scale}
               L ${center - 4*scale + offset} ${center + 6*scale}
               L ${center + 6*scale + offset} ${center} Z"
            fill="${this.offColor}" stroke="none" />
    `;
  }

  createPauseIcon(center, scale) {
    return `
      <g class="btn-icon">
        <rect x="${center - 4.5*scale}" y="${center - 6*scale}"
              width="${3*scale}" height="${12*scale}" rx="${scale}"
              fill="${this.offColor}" />
        <rect x="${center + 1.5*scale}" y="${center - 6*scale}"
              width="${3*scale}" height="${12*scale}" rx="${scale}"
              fill="${this.offColor}" />
      </g>
    `;
  }

  createStopIcon(center, scale) {
    return `
      <rect class="btn-icon"
            x="${center - 4.5*scale}" y="${center - 4.5*scale}"
            width="${9*scale}" height="${9*scale}" rx="${scale}"
            fill="${this.offColor}" />
    `;
  }

  createMidiIcon(center, scale) {
    // 5-pin DIN connector - simple circle with 5 pins
    const circleRadius = 6.5 * scale;
    const pinRadius = 0.9 * scale;

    // Pin positions in a semicircle (5 pins) - bottom half
    const pins = [];
    for (let i = 0; i < 5; i++) {
      const angle = Math.PI + (Math.PI * (i / 4)); // PI to 2*PI (bottom semicircle)
      const x = center + Math.cos(angle) * (circleRadius * 0.5);
      const y = center + Math.sin(angle) * (circleRadius * 0.5);
      pins.push({ x, y });
    }

    return `
      <g class="btn-icon">
        <!-- Connector body circle -->
        <circle cx="${center}" cy="${center}" r="${circleRadius}"
                fill="${this.offColor}" stroke="none" />

        <!-- 5 pins -->
        ${pins.map(pin =>
          `<circle cx="${pin.x}" cy="${pin.y}" r="${pinRadius}" fill="#1a1a1a" />`
        ).join('')}
      </g>
    `;
  }

  createHelpIcon(center, scale) {
    // Question mark with circular background
    const fontSize = 13 * scale;
    const yOffset = 1.5 * scale; // Adjust vertical position

    return `
      <g class="btn-icon">
        <!-- Circle background -->
        <circle cx="${center}" cy="${center}" r="${5.5 * scale}"
                fill="${this.offColor}" stroke="none" />

        <!-- Question mark -->
        <text x="${center}" y="${center + yOffset}"
              font-family="Arial, sans-serif"
              font-size="${fontSize}"
              font-weight="bold"
              fill="#1a1a1a"
              text-anchor="middle"
              dominant-baseline="middle">?</text>
      </g>
    `;
  }

  createDownloadIcon(center, scale) {
    // Download arrow with tray
    return `
      <g class="btn-icon">
        <!-- Arrow shaft -->
        <rect x="${center - 1.5*scale}" y="${center - 6*scale}"
              width="${3*scale}" height="${8*scale}" rx="${0.5*scale}"
              fill="${this.offColor}" />
        
        <!-- Arrow head (pointing down) -->
        <path d="M ${center - 5*scale} ${center + 1*scale}
                 L ${center} ${center + 6*scale}
                 L ${center + 5*scale} ${center + 1*scale} Z"
              fill="${this.offColor}" />
        
        <!-- Tray at bottom -->
        <path d="M ${center - 6*scale} ${center + 6.5*scale}
                 L ${center - 6*scale} ${center + 7.5*scale}
                 Q ${center - 6*scale} ${center + 8.5*scale} ${center - 5*scale} ${center + 8.5*scale}
                 L ${center + 5*scale} ${center + 8.5*scale}
                 Q ${center + 6*scale} ${center + 8.5*scale} ${center + 6*scale} ${center + 7.5*scale}
                 L ${center + 6*scale} ${center + 6.5*scale}"
              fill="${this.offColor}" stroke="none" />
      </g>
    `;
  }

  createOpenIcon(center, scale) {

  // Network graph: 3 nodes in triangle with connecting lines
  const nodeRadius = 2.3 * scale;
  const spacing = 7 * scale;
  const yOffset = 2 * scale;  // Adjust this value to move up/down
  
  // Calculate triangle vertices
  const topY = center - spacing * 0.866 + yOffset;
  const bottomY = center + spacing * 0.433 + yOffset;
  const leftX = center - spacing * 0.7;
  const rightX = center + spacing * 0.7;

  return `
    <g class="btn-icon">
      <!-- Connecting lines -->
      <line x1="${center}" y1="${topY}"
            x2="${leftX}" y2="${bottomY}"
            stroke="${this.offColor}" stroke-width="${scale}" stroke-linecap="round" />
      <line x1="${center}" y1="${topY}"
            x2="${rightX}" y2="${bottomY}"
            stroke="${this.offColor}" stroke-width="${scale}" stroke-linecap="round" />
      <line x1="${leftX}" y1="${bottomY}"
            x2="${rightX}" y2="${bottomY}"
            stroke="${this.offColor}" stroke-width="${scale}" stroke-linecap="round" />
      
      <!-- Nodes (circles) -->
      <circle cx="${center}" cy="${topY}"
              r="${nodeRadius}" fill="${this.offColor}" />
      <circle cx="${leftX}" cy="${bottomY}"
              r="${nodeRadius}" fill="${this.offColor}" />
      <circle cx="${rightX}" cy="${bottomY}"
              r="${nodeRadius}" fill="${this.offColor}" />
    </g>
  `;
  }

  attachEvents() {
    if (!this.element) return;

    this.element.style.cursor = 'pointer';
    this.element.style.transition = 'transform 0.1s ease';
    this.element.style.userSelect = 'none';
    this.element.style.display = 'block';

    this.element.addEventListener('mouseenter', () => {
      if (this.isEnabled) {
        this.element.style.transform = 'scale(1.05)';
      }
    });

    this.element.addEventListener('mouseleave', () => {
      this.element.style.transform = 'scale(1)';
    });

    this.element.addEventListener('mousedown', () => {
      if (this.isEnabled) {
        this.element.style.transform = 'scale(0.95)';
      }
    });

    this.element.addEventListener('mouseup', () => {
      if (this.isEnabled) {
        this.element.style.transform = 'scale(1.05)';
      }
    });

    this.element.addEventListener('click', () => {
      if (this.isEnabled) {
        this.onClick();
      }
    });
  }

  enable() {
    this.isEnabled = true;
    if (this.element) {
      this.element.style.cursor = 'pointer';
      this.element.style.opacity = '1';
    }
  }

  disable() {
    this.isEnabled = false;
    if (this.element) {
      this.element.style.cursor = 'not-allowed';
      this.element.style.opacity = '0.5';
    }
  }

  turnOn() {
    this.isOn = true;
    this.updateVisualState();
  }

  turnOff() {
    this.isOn = false;
    this.updateVisualState();
  }

  toggle() {
    this.isOn = !this.isOn;
    this.updateVisualState();
    return this.isOn;
  }

  setColor(color) {
    this.onColor = color;
    if (this.isOn) {
      this.updateVisualState();
    }
  }

  getState() {
    return {
      isEnabled: this.isEnabled,
      isOn: this.isOn
    };
  }

  updateVisualState() {
    if (!this.iconElement) return;

    const color = this.isOn ? this.onColor : this.offColor;

    // Update all fill attributes in the icon
    if (this.iconElement.tagName === 'g') {
      const paths = this.iconElement.querySelectorAll('path, rect, circle');
      paths.forEach(el => {
        // Don't change the center hole of the cog or question mark text background
        if (el.getAttribute('fill') === '#1a1a1a') return;
        el.setAttribute('fill', color);
      });
    }
    else {
      this.iconElement.setAttribute('fill', color);
    }

    // Add glow effect when on
    if (this.isOn) {
      this.iconElement.style.filter = `drop-shadow(0 0 4px ${this.onColor})`;
    }
    else {
      this.iconElement.style.filter = 'none';
    }
  }

  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
    this.iconElement = null;
  }

}
