"""Deterministic triangulation solvers."""

from __future__ import annotations

from dataclasses import asdict, dataclass
import math

EPSILON = 1e-9


@dataclass(frozen=True)
class TriangleSolution:
    ab: float
    angle_a_deg: float
    angle_b_deg: float
    angle_c_deg: float
    ac: float
    bc: float

    def as_dict(self) -> dict[str, float]:
        return asdict(self)


@dataclass(frozen=True)
class TargetSolution:
    sensor_1: tuple[float, float]
    sensor_2: tuple[float, float]
    theta1_deg: float
    theta2_deg: float
    target: tuple[float, float]
    distance_from_sensor_1: float
    distance_from_sensor_2: float

    def as_dict(self) -> dict[str, object]:
        return asdict(self)


def solve_triangle(ab: float, angle_a_deg: float, angle_b_deg: float) -> TriangleSolution:
    """Solve a triangle from one known side and two angles."""
    if ab <= 0:
        raise ValueError("Baseline AB must be positive.")
    if angle_a_deg <= 0 or angle_b_deg <= 0:
        raise ValueError("Angles A and B must be positive.")

    angle_c_deg = 180.0 - angle_a_deg - angle_b_deg
    if angle_c_deg <= 0:
        raise ValueError("Angles A and B must sum to less than 180 degrees.")

    angle_a = math.radians(angle_a_deg)
    angle_b = math.radians(angle_b_deg)
    angle_c = math.radians(angle_c_deg)

    sin_c = math.sin(angle_c)
    if abs(sin_c) < EPSILON:
        raise ValueError("Triangle is numerically unstable because angle C is too small.")

    ac = ab * math.sin(angle_b) / sin_c
    bc = ab * math.sin(angle_a) / sin_c
    return TriangleSolution(
        ab=ab,
        angle_a_deg=angle_a_deg,
        angle_b_deg=angle_b_deg,
        angle_c_deg=angle_c_deg,
        ac=ac,
        bc=bc,
    )


def solve_target_from_bearings(
    x1: float,
    y1: float,
    x2: float,
    y2: float,
    theta1_deg: float,
    theta2_deg: float,
) -> TargetSolution:
    """Locate a target from two sensor positions and bearing angles."""
    p1 = (float(x1), float(y1))
    p2 = (float(x2), float(y2))
    d1 = _direction_from_degrees(theta1_deg)
    d2 = _direction_from_degrees(theta2_deg)

    delta = (p2[0] - p1[0], p2[1] - p1[1])
    denom = _cross(d1, d2)
    if abs(denom) < EPSILON:
        raise ValueError("Sight lines are parallel or nearly parallel.")

    t1 = _cross(delta, d2) / denom
    t2 = _cross(delta, d1) / denom
    if t1 < -EPSILON or t2 < -EPSILON:
        raise ValueError("Intersection falls behind at least one sensor.")

    target = (p1[0] + t1 * d1[0], p1[1] + t1 * d1[1])
    return TargetSolution(
        sensor_1=p1,
        sensor_2=p2,
        theta1_deg=theta1_deg,
        theta2_deg=theta2_deg,
        target=target,
        distance_from_sensor_1=math.hypot(target[0] - p1[0], target[1] - p1[1]),
        distance_from_sensor_2=math.hypot(target[0] - p2[0], target[1] - p2[1]),
    )


def _direction_from_degrees(theta_deg: float) -> tuple[float, float]:
    theta = math.radians(theta_deg)
    return (math.cos(theta), math.sin(theta))


def _cross(a: tuple[float, float], b: tuple[float, float]) -> float:
    return a[0] * b[1] - a[1] * b[0]
