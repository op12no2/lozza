import sys
import numpy as np
import matplotlib.pyplot as plt

LOG_FILE = "nets/" + sys.argv[1] + "/lozza-" + sys.argv[2] + "/log.txt"

# Read and process log file
loss_by_superbatch = {}

with open(LOG_FILE, "r") as file:
    for line in file:
        parts = line.strip().split(",")
        if len(parts) == 3:
            superbatch, batch, loss = map(float, parts)
            superbatch = int(superbatch)

            if superbatch not in loss_by_superbatch:
                loss_by_superbatch[superbatch] = []
            loss_by_superbatch[superbatch].append(loss)

# Compute mean loss per superbatch
superbatches = sorted(loss_by_superbatch.keys())  # Sorted superbatch numbers
mean_losses = [np.mean(loss_by_superbatch[sb]) for sb in superbatches]

# Apply moving average for smoothing
window_size = 10  # Adjust this to control smoothing (higher = smoother)
smoothed_losses = np.convolve(mean_losses, np.ones(window_size)/window_size, mode='valid')

# Adjust x-axis for the smoothed curve (since convolution reduces array length)
smoothed_x = superbatches[:len(smoothed_losses)]

# Find the superbatch with the minimum mean loss
min_mean_idx = np.argmin(mean_losses)
min_mean_superbatch = superbatches[min_mean_idx]
min_mean_value = mean_losses[min_mean_idx]

# Find the superbatch with the minimum smoothed loss
min_smooth_idx = np.argmin(smoothed_losses)
min_smooth_superbatch = smoothed_x[min_smooth_idx]
min_smooth_value = smoothed_losses[min_smooth_idx]

# Print debugging values
print("\nSuperbatch, Mean Loss, Smoothed Loss:")
for i in range(len(smoothed_losses)):
    print(f"{superbatches[i]}, {round(mean_losses[i], 6)}, {round(smoothed_losses[i], 6)}")

# Print the minimum values
print(f"\n?? Lowest Mean Loss: Superbatch {min_mean_superbatch}, Loss {round(min_mean_value, 6)}")
print(f"?? Lowest Smoothed Loss: Superbatch {min_smooth_superbatch}, Loss {round(min_smooth_value, 6)}")

# Plot mean loss per superbatch
plt.figure(figsize=(24, 12))

# Scatter plot for original mean losses (lighter gray for subtlety)
plt.plot(superbatches, mean_losses, marker="o", color="lightgray", linestyle="-", linewidth=1, label="Raw Mean Loss Per Superbatch")

# Moving average (smoothed trend line)
plt.plot(smoothed_x, smoothed_losses, color="red", linestyle="--", linewidth=3, label=f"Smoothed Trend (Moving Avg, Window={window_size})")

# Highlight best loss superbatch on the graph
plt.axvline(min_mean_superbatch, color="blue", linestyle="dashed", linewidth=2, label=f"Min Mean Loss at SB {min_mean_superbatch}")
plt.text(min_mean_superbatch, min_mean_value, f"  {min_mean_superbatch}\n  {round(min_mean_value, 6)}",
         verticalalignment='bottom', color="blue", fontsize=12, fontweight="bold")

plt.axvline(min_smooth_superbatch, color="green", linestyle="dashed", linewidth=2, label=f"Min Smoothed Loss at SB {min_smooth_superbatch}")
plt.text(min_smooth_superbatch, min_smooth_value, f"  {min_smooth_superbatch}\n  {round(min_smooth_value, 6)}",
         verticalalignment='bottom', color="green", fontsize=12, fontweight="bold")

# Labels and grid
plt.xlabel("Superbatch")
plt.ylabel("Mean Loss")
plt.title("Mean Loss Per Superbatch with Smoothed Trend")
plt.grid(True)
plt.legend()

# Set x-ticks to show only every 10 superbatches
plt.xticks(superbatches[::50], superbatches[::50], rotation=45)

# Save plot based on input file name
#output_file = f"{LOG_FILE.rsplit('.', 1)[0]}_loss.png"
#plt.savefig(output_file, dpi=300)
plt.show()

