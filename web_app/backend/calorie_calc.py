import cv2
import numpy as np

# We know area of thumb. It is 5*2.3 cm².
SKIN_MULTIPLIER = 5 * 2.3
PIXEL_TO_CM_MULTIPLIER_CONSTANT = 5.0

# Comprehensive food nutrition catalog for fruits, vegetables, dry fruits and proteins.
# Values are realistic per-100g estimates used for calorie estimation.
density_dict = {
    "Apple": 0.96,
    "Banana": 0.94,
    "Carrot": 0.641,
    "Onion": 0.513,
    "Orange": 0.482,
    "Tomato": 0.481,
    "Qiwi": 0.575,
    "Mango": 0.88,
    "Grapes": 0.91,
    "Strawberry": 0.89,
    "Blueberry": 0.82,
    "Pineapple": 0.84,
    "Peach": 0.90,
    "Pear": 0.93,
    "Watermelon": 0.58,
    "Cherry": 0.88,
    "Avocado": 0.96,
    "Melon": 0.82,
    "Papaya": 0.81,
    "Pomegranate": 0.88,
    "Guava": 0.90,
    "Kiwi": 0.78,
    "Lemon": 0.70,
    "Lime": 0.70,
    "Grapefruit": 0.90,
    "Apricot": 0.83,
    "Nectarine": 0.90,
    "Plum": 0.88,
    "Cantaloupe": 0.84,
    "Honeydew": 0.82,
    "Blackberry": 0.83,
    "Bilberry": 0.74,
    "Mandarin": 0.90,
    "Tangerine": 0.90,
    "Coconut": 0.94,
    "Spinach": 0.72,
    "Broccoli": 0.68,
    "Cucumber": 0.59,
    "Bell Pepper": 0.64,
    "Potato": 0.82,
    "Cabbage": 0.57,
    "Lettuce": 0.46,
    "Cauliflower": 0.62,
    "Beetroot": 0.83,
    "Peas": 0.66,
    "Mushroom": 0.52,
    "Eggplant": 0.71,
    "Asparagus": 0.58,
    "Chicken Breast": 1.08,
    "Salmon": 1.12,
    "Beef": 1.15,
    "Turkey": 1.04,
    "Egg": 1.03,
    "Almonds": 0.92,
    "Walnuts": 0.92,
    "Pistachios": 0.90,
    "Cashews": 0.91,
    "Raisins": 0.90,
    "Dates": 0.94,
    "Peanuts": 0.90,
    "Apricots": 0.82,
    "Figs": 0.87,
    "Pizza": 0.28,
}

calorie_dict = {
    "Apple": 52,
    "Banana": 89,
    "Carrot": 41,
    "Onion": 40,
    "Orange": 47,
    "Tomato": 18,
    "Qiwi": 44,
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
    "Melon": 34,
    "Papaya": 43,
    "Pomegranate": 83,
    "Guava": 68,
    "Kiwi": 41,
    "Lemon": 29,
    "Lime": 30,
    "Grapefruit": 42,
    "Apricot": 48,
    "Nectarine": 44,
    "Plum": 46,
    "Cantaloupe": 34,
    "Honeydew": 36,
    "Blackberry": 43,
    "Bilberry": 57,
    "Mandarin": 53,
    "Tangerine": 53,
    "Coconut": 354,
    "Spinach": 23,
    "Broccoli": 34,
    "Cucumber": 16,
    "Bell Pepper": 31,
    "Potato": 77,
    "Cabbage": 25,
    "Lettuce": 15,
    "Cauliflower": 25,
    "Beetroot": 43,
    "Peas": 81,
    "Mushroom": 22,
    "Eggplant": 35,
    "Asparagus": 27,
    "Chicken Breast": 165,
    "Salmon": 208,
    "Beef": 250,
    "Turkey": 189,
    "Egg": 155,
    "Almonds": 579,
    "Walnuts": 654,
    "Pistachios": 562,
    "Cashews": 553,
    "Raisins": 299,
    "Dates": 282,
    "Peanuts": 567,
    "Apricots": 48,
    "Figs": 74,
    "Pizza": 266,
}

LABEL_ALIASES = {
    "apple": "Apple",
    "banana": "Banana",
    "orange": "Orange",
    "grape": "Grapes",
    "grapes": "Grapes",
    "strawberry": "Strawberry",
    "blueberry": "Blueberry",
    "mango": "Mango",
    "peach": "Peach",
    "pineapple": "Pineapple",
    "kiwi": "Qiwi",
    "qiwi": "Qiwi",
    "pear": "Pear",
    "watermelon": "Watermelon",
    "cherry": "Cherry",
    "avocado": "Avocado",
    "melon": "Melon",
    "papaya": "Papaya",
    "pomegranate": "Pomegranate",
    "guava": "Guava",
    "lemon": "Lemon",
    "lime": "Lime",
    "grapefruit": "Grapefruit",
    "apricot": "Apricots",
    "apricots": "Apricots",
    "nectarine": "Nectarine",
    "plum": "Plum",
    "cantaloupe": "Cantaloupe",
    "honeydew": "Honeydew",
    "blackberry": "Blackberry",
    "bilberry": "Bilberry",
    "mandarin": "Mandarin",
    "tangerine": "Tangerine",
    "coconut": "Coconut",
    "spinach": "Spinach",
    "broccoli": "Broccoli",
    "cucumber": "Cucumber",
    "bell pepper": "Bell Pepper",
    "pepper": "Bell Pepper",
    "potato": "Potato",
    "cabbage": "Cabbage",
    "lettuce": "Lettuce",
    "cauliflower": "Cauliflower",
    "beetroot": "Beetroot",
    "beet": "Beetroot",
    "peas": "Peas",
    "mushroom": "Mushroom",
    "eggplant": "Eggplant",
    "asparagus": "Asparagus",
    "carrot": "Carrot",
    "onion": "Onion",
    "tomato": "Tomato",
    "chicken": "Chicken Breast",
    "chicken breast": "Chicken Breast",
    "salmon": "Salmon",
    "beef": "Beef",
    "turkey": "Turkey",
    "egg": "Egg",
    "almond": "Almonds",
    "almonds": "Almonds",
    "walnut": "Walnuts",
    "walnuts": "Walnuts",
    "pistachio": "Pistachios",
    "pistachios": "Pistachios",
    "cashew": "Cashews",
    "cashews": "Cashews",
    "raisin": "Raisins",
    "raisins": "Raisins",
    "date": "Dates",
    "dates": "Dates",
    "peanut": "Peanuts",
    "peanuts": "Peanuts",
    "fig": "Figs",
    "figs": "Figs",
    "pizza": "Pizza",
}

label_list = ["thumb"] + list(calorie_dict.keys())


def normalize_label(label):
    if label is None:
        return ""
    normalized = str(label).strip()
    normalized = normalized.replace("_", " ")
    normalized = normalized.lower()
    return LABEL_ALIASES.get(normalized, normalized.title())


def getCalorie(label, volume):  # volume in cm^3
    normalized = normalize_label(label)
    if normalized not in calorie_dict:
        return 0, 0, 0
    calorie = calorie_dict[normalized]
    density = density_dict[normalized]
    mass = volume * density * 1.0
    calorie_tot = (calorie / 100.0) * mass
    return mass, calorie_tot, calorie


def getVolume(label, area, skin_area, pix_to_cm_multiplier, fruit_contour):
    normalized = normalize_label(label)
    area_fruit = (area / skin_area) * SKIN_MULTIPLIER  # area in cm^2
    volume = 100
    if normalized in ["Apple", "Orange", "Qiwi", "Tomato", "Onion", "Bell Pepper", "Mushroom", "Cucumber", "Eggplant", "Potato", "Beetroot"]:
        radius = np.sqrt(area_fruit / np.pi)
        volume = (4 / 3) * np.pi * radius * radius * radius

    if normalized in ["Banana", "Carrot", "Broccoli", "Asparagus", "Peas", "Cauliflower"] and area_fruit > 30:
        fruit_rect = cv2.minAreaRect(fruit_contour)
        height = max(fruit_rect[1]) * pix_to_cm_multiplier
        radius = area_fruit / (2.0 * height)
        volume = np.pi * radius * radius * height

    if normalized == "Carrot" and area_fruit <= 30:
        volume = area_fruit * 0.5

    return volume


def image_segmentation(cropped_img_name, cropped_img):
    cv2_img_gray = cv2.cvtColor(cropped_img, cv2.COLOR_BGR2GRAY)
    adap_thresh = cv2.adaptiveThreshold(
        cv2_img_gray, 100, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 15, 2
    )

    contours, hierarchy = cv2.findContours(
        adap_thresh, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE
    )

    if not contours:
        return None

    largest_areas = sorted(contours, key=cv2.contourArea)
    mask = np.zeros(cv2_img_gray.shape, np.uint8)
    cv2.drawContours(mask, [largest_areas[-1]], 0, (255, 255, 255, 255), -1)

    img_bitcontour = cv2.bitwise_or(cropped_img, cropped_img, mask=mask)
    hsv_img = cv2.cvtColor(img_bitcontour, cv2.COLOR_BGR2HSV)

    mask_plate = cv2.inRange(hsv_img, np.array([0, 0, 50]), np.array([200, 90, 250]))
    mask_not_plate = cv2.bitwise_not(mask_plate)
    mask_fruit = cv2.bitwise_and(img_bitcontour, img_bitcontour, mask=mask_not_plate)

    img_gray2 = cv2.cvtColor(mask_fruit, cv2.COLOR_BGR2GRAY)
    adap_thresh2 = cv2.adaptiveThreshold(
        img_gray2, 100, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 15, 2
    )
    cont2, _ = cv2.findContours(adap_thresh2, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)

    if not cont2:
        return None

    largest_areas2 = sorted(cont2, key=cv2.contourArea)
    Thumb_img_min_rectangle = None

    if cropped_img_name.startswith("thumb"):
        req_contour = largest_areas2[-1]
        req_object_area = cv2.contourArea(req_contour)

        rect = cv2.minAreaRect(req_contour)
        pix_height = max(rect[1])
        if pix_height == 0:
            pix_height = 1
        pix_to_cm_multiplier = PIXEL_TO_CM_MULTIPLIER_CONSTANT / pix_height
        result = [req_contour, req_object_area, pix_to_cm_multiplier]

    elif cropped_img_name.startswith("Carrot"):
        # If there are at least two contours, use the second largest as per original logic
        req_contour = largest_areas2[-2] if len(largest_areas2) > 1 else largest_areas2[-1]
        req_object_area = cv2.contourArea(req_contour)
        result = [req_contour, req_object_area]
    else:
        req_contour = largest_areas2[-1]
        req_object_area = cv2.contourArea(req_contour)
        result = [req_contour, req_object_area]

    return {
        "segmented_obj_contour_area_pixel": result
    }


def crop_img(input_img, img_name, bb_cordinate, pixel_margin=5):
    dh, dw, cha = input_img.shape
    xmin, ymin, w, h = bb_cordinate

    p = pixel_margin
    X_MIN = max(0, xmin - p)
    Y_MIN = max(0, ymin - p)
    Y_MAX = min(dh, (ymin + h) + p)
    X_MAX = min(dw, (xmin + w) + p)

    imgCrop = input_img[int(Y_MIN):int(Y_MAX), int(X_MIN):int(X_MAX)]
    return {
        "img_name": img_name,
        "cropped_image": imgCrop,
    }
