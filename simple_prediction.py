import random


def train_simple_model():
    """Train a simple model using handcrafted linear relationship."""
    # Generate synthetic data: y = 2*x + 3 with small noise
    X = [x for x in range(20)]
    y = [2 * x + 3 + random.uniform(-1, 1) for x in X]

    # Compute slope and intercept using ordinary least squares
    n = len(X)
    mean_x = sum(X) / n
    mean_y = sum(y) / n

    numerator = sum((X[i] - mean_x) * (y[i] - mean_y) for i in range(n))
    denominator = sum((X[i] - mean_x) ** 2 for i in range(n))
    slope = numerator / denominator
    intercept = mean_y - slope * mean_x

    return slope, intercept


def predict(x_value, slope, intercept):
    """Predict the output for a new input using the trained linear model."""
    return slope * x_value + intercept


def main():
    slope, intercept = train_simple_model()
    print(f"Trained model: y = {slope:.3f}*x + {intercept:.3f}")

    # Example predictions
    test_inputs = [5, 10, 15, 20]
    for x in test_inputs:
        y_pred = predict(x, slope, intercept)
        print(f"Input: {x} -> Predicted output: {y_pred:.3f}")


if __name__ == "__main__":
    main()
