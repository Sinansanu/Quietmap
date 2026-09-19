import pytest
from app.core.math import (
    clamp,
    normalize_relative_noise,
    calculate_stability,
    calculate_focus_score,
    format_hour_window,
    relative_noise_label,
)


def test_clamp():
    assert clamp(5, 0, 10) == 5
    assert clamp(-5, 0, 10) == 0
    assert clamp(15, 0, 10) == 10


def test_normalize_relative_noise():
    assert normalize_relative_noise(0.0) == 0.0
    assert normalize_relative_noise(-1.0) == 0.0
    assert normalize_relative_noise(1.0) == 100.0
    mid = normalize_relative_noise(0.01)
    assert 0.0 < mid < 100.0


def test_calculate_stability():
    assert calculate_stability([]) == 100.0
    assert calculate_stability([30.0]) == 100.0
    assert calculate_stability([30.0, 30.0, 30.0]) == 100.0
    variable = calculate_stability([10.0, 80.0, 20.0, 90.0])
    stable = calculate_stability([30.0, 31.0, 29.0, 30.0])
    assert stable > variable


def test_calculate_focus_score():
    high_score = calculate_focus_score(
        average_noise=20.0,
        stability=95.0,
        interruptions=0,
        duration_minutes=45.0
    )
    low_score = calculate_focus_score(
        average_noise=75.0,
        stability=30.0,
        interruptions=5,
        duration_minutes=10.0
    )
    assert high_score > low_score
    assert 0 <= high_score <= 100
    assert 0 <= low_score <= 100


def test_format_hour_window_24h_boundary():
    # Regular daytime
    assert format_hour_window(9, 2) == "9 AM-11 AM"
    assert format_hour_window(10, 2) == "10 AM-12 PM"
    assert format_hour_window(11, 2) == "11 AM-1 PM"
    assert format_hour_window(12, 2) == "12 PM-2 PM"

    # Midnight boundary - verifies fix for 11 PM -> 1 AM
    assert format_hour_window(22, 2) == "10 PM-12 AM"
    assert format_hour_window(23, 2) == "11 PM-1 AM"
    assert format_hour_window(0, 2) == "12 AM-2 AM"


def test_relative_noise_label():
    assert relative_noise_label(None) == "Waiting"
    assert relative_noise_label(10) == "Very quiet"
    assert relative_noise_label(25) == "Quiet"
    assert relative_noise_label(45) == "Moderate"
    assert relative_noise_label(65) == "Noisy"
    assert relative_noise_label(85) == "Very noisy"
