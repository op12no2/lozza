#
# Find the SB with the minimum mean batch loss.
#
# Example use: python3 loss.py blooper 1000
#

import sys
import numpy as np
import matplotlib.pyplot as plt

ROOT_DIR = "nets/" + sys.argv[1]
LOG_DIR  = ROOT_DIR + "/lozza-" + sys.argv[2]
LOG_FILE = LOG_DIR + "/log.txt"

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

superbatches = sorted(loss_by_superbatch.keys())
mean_losses = [np.mean(loss_by_superbatch[sb]) for sb in superbatches]

window_size = 10
smoothed_losses = np.convolve(mean_losses, np.ones(window_size)/window_size, mode='valid')

smoothed_x = superbatches[:len(smoothed_losses)]

min_mean_idx = np.argmin(mean_losses)
min_mean_superbatch = superbatches[min_mean_idx]
min_mean_value = mean_losses[min_mean_idx]

min_smooth_idx = np.argmin(smoothed_losses)
min_smooth_superbatch = smoothed_x[min_smooth_idx]
min_smooth_value = smoothed_losses[min_smooth_idx]

print("\nSuperbatch, Mean Loss, Smoothed Loss:")
for i in range(len(smoothed_losses)):
    print(f"{superbatches[i]}, {round(mean_losses[i], 6)}, {round(smoothed_losses[i], 6)}")

print(f"\n?? Lowest Mean Loss: Superbatch {min_mean_superbatch}, Loss {round(min_mean_value, 6)}")
print(f"?? Lowest Smoothed Loss: Superbatch {min_smooth_superbatch}, Loss {round(min_smooth_value, 6)}")

plt.figure(figsize=(24, 12))

plt.plot(superbatches, mean_losses, marker="o", color="lightgray", linestyle="-", linewidth=1, label="Raw Mean Loss Per Superbatch")

plt.plot(smoothed_x, smoothed_losses, color="red", linestyle="--", linewidth=3, label=f"Smoothed Trend (Moving Avg, Window={window_size})")

plt.axvline(min_mean_superbatch, color="blue", linestyle="dashed", linewidth=2, label=f"Min Mean Loss at SB {min_mean_superbatch}")
plt.text(min_mean_superbatch, min_mean_value, f"  {min_mean_superbatch}\n  {round(min_mean_value, 6)}",
         verticalalignment='bottom', color="blue", fontsize=12, fontweight="bold")

plt.axvline(min_smooth_superbatch, color="green", linestyle="dashed", linewidth=2, label=f"Min Smoothed Loss at SB {min_smooth_superbatch}")
plt.text(min_smooth_superbatch, min_smooth_value, f"  {min_smooth_superbatch}\n  {round(min_smooth_value, 6)}",
         verticalalignment='bottom', color="green", fontsize=12, fontweight="bold")

plt.xlabel("Superbatch")
plt.ylabel("Mean Loss")
plt.title("Mean Loss Per Superbatch with Smoothed Trend")
plt.grid(True)
plt.legend()

plt.xticks(superbatches[::50], [sb - 1 for sb in superbatches[::50]], rotation=45)

output_file = ROOT_DIR + "/loss.png"
plt.savefig(output_file, dpi=300)

plt.show()

