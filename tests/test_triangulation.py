import asyncio
import math
import os
import subprocess
import sys
import unittest
from pathlib import Path

os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")

import server
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


class TriangulationApiTests(unittest.TestCase):
    def test_triangle_route_returns_solution(self) -> None:
        result = asyncio.run(
            server.triangulation_triangle(
                server.TriangleSolveInput(ab=10.0, angle_a=30.0, angle_b=60.0)
            )
        )
        self.assertEqual(result["angle_c_deg"], 90.0)
        self.assertAlmostEqual(result["ac"], 8.6602540378)

    def test_triangle_route_returns_400_for_invalid_triangle(self) -> None:
        with self.assertRaises(server.HTTPException) as ctx:
            asyncio.run(
                server.triangulation_triangle(
                    server.TriangleSolveInput(ab=10.0, angle_a=100.0, angle_b=80.0)
                )
            )
        self.assertEqual(ctx.exception.status_code, 400)

    def test_target_route_returns_solution(self) -> None:
        result = asyncio.run(
            server.triangulation_target(
                server.TargetSolveInput(
                    x1=0.0,
                    y1=0.0,
                    x2=10.0,
                    y2=0.0,
                    theta1=45.0,
                    theta2=135.0,
                )
            )
        )
        self.assertAlmostEqual(result["target"][0], 5.0)
        self.assertAlmostEqual(result["target"][1], 5.0)

    def test_ui_route_returns_html(self) -> None:
        response = asyncio.run(server.triangulation_ui())
        self.assertIn("Governess Triangulation Studio", response.body.decode("utf-8"))
        self.assertIn("/api/triangulation/triangle", response.body.decode("utf-8"))


if __name__ == "__main__":
    unittest.main()
