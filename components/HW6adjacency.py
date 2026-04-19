import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# Load data
url = "https://gist.githubusercontent.com/hogwild/a716b6186d730c1d86962e9acaa1e59f/raw/aca017d18e2330668ef2765c5c049f89becda4ac/healthcare_stroke_data.csv"
df = pd.read_csv(url)

# Attributes for your sketch
attributes = [
    "gender",
    "hypertension",
    "heart_disease",
    "ever_married",
    "smoking_status",
    "stroke"
]

# Define binary conditions for each attribute
attribute_conditions = {
    "gender": df["gender"].notna(),
    "hypertension": df["hypertension"] == 1,
    "heart_disease": df["heart_disease"] == 1,
    "ever_married": df["ever_married"] == "Yes",
    "smoking_status": (df["smoking_status"].notna()) & (df["smoking_status"] != "Unknown"),
    "stroke": df["stroke"] == 1
}

# Build normalized similarity matrix
matrix = pd.DataFrame(index=attributes, columns=attributes, dtype=float)

for row_attr in attributes:
    for col_attr in attributes:
        a = attribute_conditions[row_attr]
        b = attribute_conditions[col_attr]

        intersection = (a & b).sum()
        denom = np.sqrt(a.sum() * b.sum())

        if denom == 0:
            matrix.loc[row_attr, col_attr] = 0
        else:
            matrix.loc[row_attr, col_attr] = intersection / denom

print("Normalized similarity matrix:")
print(matrix.round(3))

# Plot heatmap
fig, ax = plt.subplots(figsize=(8, 6))
im = ax.imshow(matrix.values, cmap="Reds", vmin=0, vmax=1)

# Axis labels
ax.set_xticks(np.arange(len(attributes)))
ax.set_yticks(np.arange(len(attributes)))
ax.set_xticklabels(attributes, rotation=45, ha="right")
ax.set_yticklabels(attributes)

# Add values in cells
for i in range(len(attributes)):
    for j in range(len(attributes)):
        ax.text(j, i, f"{matrix.iloc[i, j]:.2f}",
                ha="center", va="center", color="black", fontsize=9)

ax.set_title("Normalized Attribute Relationship Heatmap")
plt.colorbar(im, ax=ax, label="Similarity (0 to 1)")
plt.tight_layout()
plt.show()