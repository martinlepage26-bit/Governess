# Triangulation

Angle-based triangulation helpers for the `Governess` repository.

This mini-package supports two deterministic workflows:

- solve a triangle from one known side and two angles
- locate a target from two sensor positions and two bearing angles

## Workflows

### 1. Triangle from baseline and two angles

Inputs:

- baseline `AB`
- angle `A`
- angle `B`

The solver computes:

- angle `C = 180 - A - B`
- side `AC`
- side `BC`

Example:

```bash
python3 -m triangulation triangle --ab 10 --angle-a 30 --angle-b 60
```

JSON output:

```bash
python3 -m triangulation triangle --ab 10 --angle-a 30 --angle-b 60 --json
```

### 2. Target from two sensors and bearings

Inputs:

- sensor 1 at `(x1, y1)` with bearing `theta1`
- sensor 2 at `(x2, y2)` with bearing `theta2`

By default:

- angles are in degrees
- bearings are measured counterclockwise from the positive x-axis

Example:

```bash
python3 -m triangulation target \
  --x1 0 --y1 0 \
  --x2 10 --y2 0 \
  --theta1 45 --theta2 135
```

If your bearings are compass headings clockwise from north, convert them first:

```text
theta_math = 90 - heading_clockwise_from_north
```

## Files

- `solver.py`: deterministic geometry helpers
- `cli.py`: command-line interface
- `__main__.py`: `python3 -m triangulation` entrypoint

## Notes

- Triangle mode requires positive baseline and positive angles with `A + B < 180`.
- Target mode rejects parallel or nearly parallel lines of sight.
- Target mode also rejects intersections that fall behind either sensor ray.
