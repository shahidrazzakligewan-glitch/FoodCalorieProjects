import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT))

from web_app.backend import calorie_calc


def test_supported_food_categories_include_meat_and_vegetables():
    required = [
        "Spinach",
        "Broccoli",
        "Chicken Breast",
        "Almonds",
        "Walnuts",
        "Pistachios",
        "Carrot",
        "Tomato",
        "Mango",
        "Blueberry",
        "Pineapple",
        "Watermelon",
    ]
    for food in required:
        assert food in calorie_calc.calorie_dict


def test_fruit_calories_are_realistic():
    expected = {
        "Apple": 52,
        "Banana": 89,
        "Orange": 47,
        "Mango": 60,
        "Grapes": 69,
        "Strawberry": 32,
        "Blueberry": 57,
        "Pineapple": 50,
        "Peach": 39,
        "Pear": 57,
        "Watermelon": 30,
        "Cherry": 63,
        "Avocado": 160,
    }
    for food, calories in expected.items():
        assert calorie_calc.calorie_dict[food] == calories


def test_get_calorie_handles_normalized_labels():
    mass, kcal, _ = calorie_calc.getCalorie("chicken breast", 100)
    assert mass > 0
    assert kcal > 0
