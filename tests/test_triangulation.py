import math
import subprocess
import sys
import unittest
from pathlib import Path

from triangulation.solver import solve_target_from_bearings, solve_triangle


ROOT = Path(__file__).resolve().parents[1]


class TriangulationSolverTests(unittest.TestCase):
    def test_solve_triangle_returns_expected_lengths(self) -> None:
        solution = solve_triangle(10.0, 30.0, 60.0)
        self.assertAlmostEqual(solution.angle_c_deg, 90.0)
        self.assertAlmostEqual(solution.ac, 8.6602540378)
        self.assertAlmostEqual(solution.bc, 5.0)

    def test_solve_triangle_rejects_invalid_angles(self) -> None:
        with self.assertRaisesRegex(ValueError, "sum to less than 180"):
            solve_triangle(10.0, 100.0, 80.0)

    def test_solve_target_from_bearings_finds_intersection(self) -> None:
        solution = solve_target_from_bearings(0.0, 0.0, 10.0, 0.0, 45.0, 135.0)
        x, y = solution.target
        self.assertAlmostEqual(x, 5.0)
        self.assertAlmostEqual(y, 5.0)
        self.assertAlmostEqual(solution.distance_from_sensor_1, math.sqrt(50.0))
        self.assertAlmostEqual(solution.distance_from_sensor_2, math.sqrt(50.0))

    def test_solve_target_from_bearings_rejects_parallel_rays(self) -> None:
        with self.assertRaisesRegex(ValueError, "parallel"):
            solve_target_from_bearings(0.0, 0.0, 1.0, 1.0, 45.0, 45.0)


class TriangulationCliTests(unittest.TestCase):
    def test_cli_triangle_json(self) -> None:
        result = subprocess.run(
            [sys.executable, "-m", "triangulation", "triangle", "--ab", "10", "--angle-a", "30", "--angle-b", "60", "--json"],
            cwd=ROOT,
            capture_output=True,
            check=True,
            text=True,
        )
        self.assertIn('"angle_c_deg": 90.0', result.stdout)

    def test_cli_target_text(self) -> None:
        result = subprocess.run(
            [
                sys.executable,
                "-m",
                "triangulation",
                "target",
                "--x1",
                "0",
                "--y1",
                "0",
                "--x2",
                "10",
                "--y2",
                "0",
                "--theta1",
                "45",
                "--theta2",
                "135",
            ],
            cwd=ROOT,
            capture_output=True,
            check=True,
            text=True,
        )
        self.assertIn("Target: (5.000000, 5.000000)", result.stdout)


if __name__ == "__main__":
    unittest.main()
