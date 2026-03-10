"""CLI for the triangulation mini-package."""

from __future__ import annotations

import argparse
import json

from .solver import solve_target_from_bearings, solve_triangle


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Solve deterministic triangulation problems.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    triangle = subparsers.add_parser("triangle", help="Solve a triangle from one side and two angles.")
    triangle.add_argument("--ab", type=float, required=True, help="Known baseline AB.")
    triangle.add_argument("--angle-a", type=float, required=True, help="Angle at point A in degrees.")
    triangle.add_argument("--angle-b", type=float, required=True, help="Angle at point B in degrees.")
    triangle.add_argument("--json", action="store_true", help="Emit machine-readable JSON.")

    target = subparsers.add_parser("target", help="Locate a target from two sensor bearings.")
    target.add_argument("--x1", type=float, required=True, help="Sensor 1 x coordinate.")
    target.add_argument("--y1", type=float, required=True, help="Sensor 1 y coordinate.")
    target.add_argument("--x2", type=float, required=True, help="Sensor 2 x coordinate.")
    target.add_argument("--y2", type=float, required=True, help="Sensor 2 y coordinate.")
    target.add_argument("--theta1", type=float, required=True, help="Sensor 1 bearing in degrees.")
    target.add_argument("--theta2", type=float, required=True, help="Sensor 2 bearing in degrees.")
    target.add_argument("--json", action="store_true", help="Emit machine-readable JSON.")

    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    if args.command == "triangle":
        solution = solve_triangle(args.ab, args.angle_a, args.angle_b)
    else:
        solution = solve_target_from_bearings(args.x1, args.y1, args.x2, args.y2, args.theta1, args.theta2)

    if args.json:
        print(json.dumps(solution.as_dict(), indent=2, sort_keys=True))
        return 0

    if args.command == "triangle":
        print(f"Angle C: {solution.angle_c_deg:.6f} degrees")
        print(f"Side AC: {solution.ac:.6f}")
        print(f"Side BC: {solution.bc:.6f}")
        return 0

    tx, ty = solution.target
    print(f"Target: ({tx:.6f}, {ty:.6f})")
    print(f"Distance from sensor 1: {solution.distance_from_sensor_1:.6f}")
    print(f"Distance from sensor 2: {solution.distance_from_sensor_2:.6f}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
