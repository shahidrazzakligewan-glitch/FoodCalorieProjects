import { useState } from 'react';
import { Search, Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import './CalorieCalculator.css';

const CALORIENINJAS_KEY = import.meta.env.VITE_CALORIENINJAS_API_KEY;

export default function CalorieCalculator() {
    const { user } = useAuth();
    const [query, setQuery] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [saved, setSaved] = useState(false);

    const localNutritionMap = {
        apple: { calories: 52, protein: 0.3, carbs: 13.8, fat: 0.2, fiber: 2.4, sugar: 10.4 },
        banana: { calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3, fiber: 2.6, sugar: 12.2 },
        orange: { calories: 47, protein: 0.9, carbs: 11.8, fat: 0.1, fiber: 2.4, sugar: 9.4 },
        kiwi: { calories: 41, protein: 1.1, carbs: 9.8, fat: 0.5, fiber: 3.0, sugar: 8.9 },
        grapes: { calories: 69, protein: 0.7, carbs: 18.1, fat: 0.2, fiber: 0.9, sugar: 15.5 },
        strawberry: { calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3, fiber: 2.0, sugar: 4.9 },
        mango: { calories: 60, protein: 0.8, carbs: 14.9, fat: 0.4, fiber: 1.6, sugar: 13.7 },
        peach: { calories: 39, protein: 0.9, carbs: 9.5, fat: 0.3, fiber: 1.5, sugar: 8.4 },
        pineapple: { calories: 50, protein: 0.5, carbs: 13.1, fat: 0.1, fiber: 1.4, sugar: 9.9 },
        blueberry: { calories: 57, protein: 0.7, carbs: 14.5, fat: 0.3, fiber: 2.0, sugar: 10.0 },
        cherry: { calories: 63, protein: 1.0, carbs: 16.0, fat: 0.2, fiber: 2.1, sugar: 12.8 },
        lemon: { calories: 29, protein: 1.1, carbs: 9.3, fat: 0.3, fiber: 2.8, sugar: 2.5 },
        pear: { calories: 57, protein: 0.4, carbs: 15.2, fat: 0.1, fiber: 3.1, sugar: 9.8 },
        watermelon: { calories: 30, protein: 0.6, carbs: 7.6, fat: 0.2, fiber: 0.4, sugar: 6.2 },
        coconut: { calories: 354, protein: 3.3, carbs: 15.2, fat: 33.5, fiber: 9.0, sugar: 6.2 },
        melon: { calories: 34, protein: 1.0, carbs: 8.2, fat: 0.2, fiber: 0.9, sugar: 7.4 },
        apricot: { calories: 48, protein: 1.4, carbs: 11.1, fat: 0.4, fiber: 2.0, sugar: 9.2 },
        mandarin: { calories: 53, protein: 0.8, carbs: 13.4, fat: 0.3, fiber: 1.8, sugar: 10.6 },
        lime: { calories: 30, protein: 0.7, carbs: 10.5, fat: 0.2, fiber: 2.8, sugar: 1.7 },
        blackberry: { calories: 43, protein: 1.4, carbs: 9.6, fat: 0.5, fiber: 5.3, sugar: 4.9 },
        bilberry: { calories: 57, protein: 0.7, carbs: 14.5, fat: 0.3, fiber: 2.0, sugar: 10.0 },
        nectarine: { calories: 44, protein: 1.1, carbs: 10.6, fat: 0.3, fiber: 1.7, sugar: 7.9 },
        plum: { calories: 46, protein: 0.7, carbs: 11.4, fat: 0.3, fiber: 1.4, sugar: 9.9 },
        cantaloupe: { calories: 34, protein: 1.0, carbs: 8.2, fat: 0.2, fiber: 0.9, sugar: 7.4 },
        honeydew: { calories: 36, protein: 0.5, carbs: 9.1, fat: 0.1, fiber: 0.8, sugar: 8.1 },
        papaya: { calories: 43, protein: 0.5, carbs: 10.8, fat: 0.3, fiber: 1.7, sugar: 7.8 },
        pomegranate: { calories: 83, protein: 1.7, carbs: 18.7, fat: 1.2, fiber: 4.0, sugar: 13.7 },
        guava: { calories: 68, protein: 2.6, carbs: 14.3, fat: 1.0, fiber: 5.4, sugar: 9.0 },
        grapefruit: { calories: 42, protein: 0.8, carbs: 10.7, fat: 0.1, fiber: 1.6, sugar: 6.5 },
        avocado: { calories: 160, protein: 2.0, carbs: 8.5, fat: 14.7, fiber: 6.7, sugar: 0.7 },
        currant: { calories: 56, protein: 1.4, carbs: 13.8, fat: 0.4, fiber: 4.3, sugar: 7.4 },
        fig: { calories: 74, protein: 0.8, carbs: 19.2, fat: 0.3, fiber: 2.9, sugar: 16.3 },
        raisin: { calories: 299, protein: 3.1, carbs: 79.8, fat: 0.5, fiber: 3.7, sugar: 59.2 },
        date: { calories: 282, protein: 2.5, carbs: 75.0, fat: 0.4, fiber: 6.7, sugar: 63.4 },
        spinach: { calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2, sugar: 0.4 },
        broccoli: { calories: 34, protein: 2.8, carbs: 6.6, fat: 0.4, fiber: 2.4, sugar: 1.7 },
        cucumber: { calories: 16, protein: 0.7, carbs: 3.6, fat: 0.1, fiber: 0.5, sugar: 1.7 },
        'bell pepper': { calories: 31, protein: 1.0, carbs: 6.0, fat: 0.3, fiber: 2.1, sugar: 4.2 },
        potato: { calories: 77, protein: 2.0, carbs: 17.5, fat: 0.1, fiber: 2.2, sugar: 0.8 },
        cabbage: { calories: 25, protein: 1.3, carbs: 5.8, fat: 0.1, fiber: 2.5, sugar: 3.2 },
        lettuce: { calories: 15, protein: 1.4, carbs: 2.9, fat: 0.2, fiber: 1.2, sugar: 0.8 },
        cauliflower: { calories: 25, protein: 1.9, carbs: 5.0, fat: 0.3, fiber: 2.0, sugar: 1.9 },
        beetroot: { calories: 43, protein: 1.6, carbs: 9.6, fat: 0.2, fiber: 2.8, sugar: 6.8 },
        peas: { calories: 81, protein: 5.4, carbs: 14.5, fat: 0.4, fiber: 5.1, sugar: 5.7 },
        mushroom: { calories: 22, protein: 3.1, carbs: 3.3, fat: 0.3, fiber: 1.0, sugar: 1.0 },
        eggplant: { calories: 35, protein: 1.2, carbs: 6.9, fat: 0.2, fiber: 3.0, sugar: 3.4 },
        asparagus: { calories: 27, protein: 2.2, carbs: 3.9, fat: 0.1, fiber: 2.1, sugar: 1.3 },
        'chicken breast': { calories: 165, protein: 31.0, carbs: 0.0, fat: 3.6, fiber: 0.0, sugar: 0.0 },
        salmon: { calories: 208, protein: 20.0, carbs: 0.0, fat: 13.0, fiber: 0.0, sugar: 0.0 },
        beef: { calories: 250, protein: 26.0, carbs: 0.0, fat: 17.0, fiber: 0.0, sugar: 0.0 },
        turkey: { calories: 189, protein: 29.0, carbs: 0.0, fat: 7.0, fiber: 0.0, sugar: 0.0 },
        egg: { calories: 155, protein: 12.6, carbs: 1.1, fat: 11.0, fiber: 0.0, sugar: 1.1 },
        almonds: { calories: 579, protein: 21.2, carbs: 21.6, fat: 49.9, fiber: 12.5, sugar: 4.4 },
        walnuts: { calories: 654, protein: 15.2, carbs: 13.7, fat: 65.2, fiber: 6.7, sugar: 2.6 },
        pistachios: { calories: 562, protein: 20.0, carbs: 27.2, fat: 45.3, fiber: 10.6, sugar: 4.0 },
        cashews: { calories: 553, protein: 18.2, carbs: 30.2, fat: 43.9, fiber: 3.3, sugar: 2.2 },
        peanuts: { calories: 567, protein: 25.8, carbs: 16.1, fat: 49.2, fiber: 8.5, sugar: 4.5 },
        garlic: { calories: 149, protein: 6.4, carbs: 33.1, fat: 0.5, fiber: 2.1, sugar: 1.0 },
        beans: { calories: 132, protein: 8.7, carbs: 23.9, fat: 0.5, fiber: 6.4, sugar: 0.9 },
    };

    const foodCategories = [
        {
            label: 'Fruits',
            items: [
                { emoji: '🍎', name: 'Apple' },
                { emoji: '🍌', name: 'Banana' },
                { emoji: '🍊', name: 'Orange' },
                { emoji: '🥝', name: 'Kiwi' },
                { emoji: '🍇', name: 'Grapes' },
                { emoji: '🍓', name: 'Strawberry' },
                { emoji: '🥭', name: 'Mango' },
                { emoji: '🍑', name: 'Peach' },
                { emoji: '🍍', name: 'Pineapple' },
                { emoji: '🫐', name: 'Blueberry' },
                { emoji: '🍒', name: 'Cherry' },
                { emoji: '🍋', name: 'Lemon' },
                { emoji: '🍐', name: 'Pear' },
                { emoji: '🍉', name: 'Watermelon' },
                { emoji: '🥥', name: 'Coconut' },
                { emoji: '🍈', name: 'Melon' },
                { emoji: '🍑', name: 'Apricot' },
                { emoji: '🍊', name: 'Mandarin' },
                { emoji: '🍋', name: 'Lime' },
                { emoji: '🫐', name: 'Blackberry' },
                { emoji: '🫐', name: 'Bilberry' },
                { emoji: '🍑', name: 'Nectarine' },
                { emoji: '🍑', name: 'Plum' },
                { emoji: '🍈', name: 'Cantaloupe' },
                { emoji: '🍈', name: 'Honeydew' },
                { emoji: '🍍', name: 'Papaya' },
                { emoji: '🍊', name: 'Grapefruit' },
                { emoji: '🍏', name: 'Guava' },
                { emoji: '🍎', name: 'Pomegranate' },
                { emoji: '🥑', name: 'Avocado' },
                { emoji: '🍇', name: 'Currant' },
                { emoji: '🍊', name: 'Tangerine' },
                { emoji: '🍇', name: 'Fig' },
            ]
        },
        {
            label: 'Vegetables',
            items: [
                { emoji: '🥕', name: 'Carrot' },
                { emoji: '🍅', name: 'Tomato' },
                { emoji: '🧅', name: 'Onion' },
                { emoji: '🥬', name: 'Spinach' },
                { emoji: '🥦', name: 'Broccoli' },
                { emoji: '🥒', name: 'Cucumber' },
                { emoji: '🫑', name: 'Bell Pepper' },
                { emoji: '🥔', name: 'Potato' },
                { emoji: '🥬', name: 'Cabbage' },
                { emoji: '🌿', name: 'Lettuce' },
                { emoji: '🥦', name: 'Cauliflower' },
                { emoji: '🧄', name: 'Garlic' },
                { emoji: '🍠', name: 'Beetroot' },
                { emoji: '🫛', name: 'Peas' },
                { emoji: '🍄', name: 'Mushroom' },
                { emoji: '🍆', name: 'Eggplant' },
                { emoji: '🌱', name: 'Asparagus' },
            ]
        },
        {
            label: 'Dry Fruits',
            items: [
                { emoji: '🥜', name: 'Peanuts' },
                { emoji: '🌰', name: 'Almonds' },
                { emoji: '🥜', name: 'Walnuts' },
                { emoji: '🥜', name: 'Pistachios' },
                { emoji: '🥭', name: 'Cashews' },
                { emoji: '🍇', name: 'Raisins' },
                { emoji: '📅', name: 'Dates' },
                { emoji: '🍑', name: 'Apricots' },
                { emoji: '🧃', name: 'Figs' },
            ]
        },
        {
            label: 'Meat & Protein',
            items: [
                { emoji: '🍗', name: 'Chicken Breast' },
                { emoji: '🐟', name: 'Salmon' },
                { emoji: '🥩', name: 'Beef' },
                { emoji: '🍖', name: 'Turkey' },
                { emoji: '🥚', name: 'Egg' },
                { emoji: '🫘', name: 'Beans' },
            ]
        }
    ];

    const healthBenefits = {
        apple: ['Rich in antioxidants & flavonoids', 'Supports heart health', 'Aids digestion with soluble fiber'],
        banana: ['Great source of potassium', 'Natural energy booster', 'Supports muscle recovery'],
        orange: ['Excellent source of Vitamin C', 'Boosts immune system', 'Promotes healthy skin'],
        kiwi: ['Packed with Vitamin C & K', 'Supports digestive health', 'Rich in antioxidants'],
        grapes: ['Rich in resveratrol antioxidant', 'Supports cardiovascular health', 'Anti-inflammatory properties'],
        strawberry: ['High in Vitamin C & manganese', 'Supports brain health', 'May help regulate blood sugar'],
        mango: ['Rich in Vitamin A & C', 'Boosts immunity', 'Supports eye health'],
        peach: ['Good source of Vitamins A & C', 'Supports skin health', 'Aids digestion'],
        pineapple: ['Contains bromelain enzyme', 'Anti-inflammatory benefits', 'Supports immune function'],
        blueberry: ['One of the highest antioxidant foods', 'Supports brain health', 'May lower blood pressure'],
        cherry: ['Rich in anti-inflammatory compounds', 'Supports sleep quality', 'Aids post-exercise recovery'],
        lemon: ['High in Vitamin C', 'Aids digestion', 'Natural detoxifier'],
        tomato: ['Rich in lycopene', 'Supports heart health', 'Good source of Vitamin C'],
        carrot: ['Excellent source of beta-carotene', 'Supports eye health', 'Boosts immune system'],
        onion: ['Contains quercetin antioxidant', 'Anti-inflammatory properties', 'Supports heart health'],
        spinach: ['High in iron and folate', 'Great for energy and immunity', 'Supports muscle and bone health'],
        broccoli: ['Rich in fiber and Vitamin C', 'Supports detoxification', 'Promotes gut health'],
        cucumber: ['Hydrating and low-calorie', 'Supports skin hydration', 'Good for digestion'],
        'bell pepper': ['Packed with Vitamin C', 'Helps protect cells from oxidation', 'Supports healthy skin'],
        potato: ['Good source of potassium', 'Provides energy from carbohydrates', 'High in fiber when eaten with skin'],
        cabbage: ['Supports digestion', 'Rich in Vitamin K', 'Good for gut health'],
        lettuce: ['Hydrating and low calorie', 'Helps with satiety', 'Contains folate and vitamin K'],
        cauliflower: ['Rich in fiber and choline', 'Supports liver health', 'Anti-inflammatory'],
        beetroot: ['Great for endurance', 'Supports blood flow', 'Rich in nitrates'],
        peas: ['High in protein and fiber', 'Supports heart health', 'Nice plant-based energy source'],
        mushroom: ['Contains B vitamins', 'Supports immune function', 'Rich in antioxidants'],
        eggplant: ['Good source of fiber', 'Contains anthocyanins', 'Supports heart health'],
        asparagus: ['Supports digestion', 'Rich in folate and antioxidants', 'Good source of potassium'],
        'chicken breast': ['Lean protein source', 'Helps build and repair muscle', 'Supports satiety and weight control'],
        salmon: ['Rich in omega-3 fatty acids', 'Supports heart and brain health', 'Anti-inflammatory'],
        beef: ['High in protein and iron', 'Supports muscle growth', 'Provides essential B12'],
        turkey: ['Lean protein option', 'Rich in selenium', 'Supports immune health'],
        egg: ['High-quality protein', 'Contains choline', 'Helpful for satiety'],
        almonds: ['Rich in heart-healthy fats', 'Supports brain function', 'Great source of Vitamin E'],
        walnuts: ['Excellent source of omega-3 plant fats', 'Supports brain health', 'Anti-inflammatory'],
        pistachios: ['Good source of protein', 'Supports blood sugar balance', 'Contains healthy fats'],
        cashews: ['Mineral-rich and energy-dense', 'Supports bone health', 'Contains beneficial monounsaturated fats'],
        raisins: ['Natural energy boost', 'Source of fiber', 'Great for quick snacks'],
        dates: ['Natural sweetener', 'Good energy source', 'Rich in potassium'],
        peanuts: ['Good plant protein', 'Rich in healthy fats', 'Supports heart health'],
        apricots: ['Rich in beta-carotene', 'Supports vision', 'Good source of fiber'],
        figs: ['Source of fiber and minerals', 'Good for digestion', 'Natural sweetness'],
    };

    const funFacts = {
        apple: 'There are over 7,500 varieties of apples grown worldwide!',
        banana: 'Bananas are technically berries, while strawberries are not!',
        orange: 'A single orange tree can produce up to 60,000 flowers!',
        kiwi: 'Kiwis contain more Vitamin C per ounce than most other fruits!',
        grapes: 'It takes about 2.5 pounds of grapes to make one bottle of wine!',
        strawberry: 'Strawberries are the only fruit with seeds on the outside!',
        mango: 'Mangoes are related to cashews and pistachios!',
        peach: 'Peaches are a member of the rose family!',
        pineapple: 'A pineapple plant can take 2-3 years to produce a single fruit!',
        blueberry: 'Blueberries are one of the only natural foods that are truly blue!',
        cherry: 'The average cherry tree produces about 7,000 cherries per year!',
        lemon: 'Lemons contain more sugar than strawberries!',
        spinach: 'Spinach is rich in iron and was famously used by Popeye to build strength!',
        broccoli: 'Broccoli is a cruciferous vegetable and one of the most nutrient-dense foods',
        carrot: 'Carrots were originally purple before orange carrots became common!',
        tomato: 'Tomatoes are fruits botanically but are commonly treated as vegetables!',
        onion: 'Onions have been cultivated for more than 5,000 years!',
        'chicken breast': 'Chicken breast is one of the leanest and most protein-dense meats by weight.',
        salmon: 'Salmon is known for its omega-3 fats and is often recommended for heart health.',
        almonds: 'Almonds are technically seeds, not nuts, and are a powerful source of healthy fats.',
        walnuts: 'Walnuts are one of the few foods with a high amount of plant-based omega-3s.',
        peanuts: 'Peanuts are legumes, not true nuts, and are naturally high in protein.',
    };

    const searchCalories = async (searchTerm) => {
        const term = searchTerm || query;
        if (!term.trim()) return;

        setLoading(true);
        setError('');
        setResult(null);

        try {
            const normalized = term.trim();
            const lookupKey = Object.keys(localNutritionMap).find((key) => key.toLowerCase() === normalized.toLowerCase());
            const fallbackData = lookupKey ? [{
                name: lookupKey,
                serving_size_g: 100,
                calories: localNutritionMap[lookupKey].calories,
                protein_g: localNutritionMap[lookupKey].protein,
                carbohydrates_total_g: localNutritionMap[lookupKey].carbs,
                fat_total_g: localNutritionMap[lookupKey].fat,
                fiber_g: localNutritionMap[lookupKey].fiber,
                sugar_g: localNutritionMap[lookupKey].sugar,
            }] : null;

            let items = fallbackData;
            try {
                const response = await fetch(
                    `https://api.calorieninjas.com/v1/nutrition?query=${encodeURIComponent(normalized)}`,
                    {
                        headers: {
                            'X-Api-Key': CALORIENINJAS_KEY
                        }
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    if (data.items && data.items.length > 0) {
                        items = data.items;
                    }
                }
            } catch (apiError) {
                console.warn('Falling back to local nutrition data:', apiError);
            }

            if (!items || items.length === 0) {
                setError(`No nutritional data found for "${term}". Try a different search term.`);
                setLoading(false);
                return;
            }

            const primaryItem = items[0];
            const totalCalories = items.reduce((sum, item) => sum + (item.calories || 0), 0);
            const nameKey = (primaryItem.name || normalized).toLowerCase();
            const safeFood = localNutritionMap[nameKey] || localNutritionMap[lookupKey] || {};

            const benefits = healthBenefits[nameKey] || [
                'Provides essential nutrients',
                'Part of a balanced diet',
                'Contains important micronutrients'
            ];
            const fact = funFacts[nameKey] || `${primaryItem.name || normalized} is a nutritious food choice for a healthy lifestyle!`;

            const formattedResult = {
                name: (primaryItem.name || normalized).charAt(0).toUpperCase() + (primaryItem.name || normalized).slice(1),
                serving_size: `${primaryItem.serving_size_g || 100}g serving`,
                calories: Math.round(totalCalories * 10) / 10,
                protein: Math.round((primaryItem.protein_g || safeFood.protein || 0) * 10) / 10,
                carbs: Math.round((primaryItem.carbohydrates_total_g || safeFood.carbs || 0) * 10) / 10,
                fat: Math.round((primaryItem.fat_total_g || safeFood.fat || 0) * 10) / 10,
                fiber: Math.round((primaryItem.fiber_g || safeFood.fiber || 0) * 10) / 10,
                sugar: Math.round((primaryItem.sugar_g || safeFood.sugar || 0) * 10) / 10,
                sodium: `${Math.round(primaryItem.sodium_mg || 0)}mg`,
                potassium: `${Math.round(primaryItem.potassium_mg || 0)}mg`,
                cholesterol: `${Math.round(primaryItem.cholesterol_mg || 0)}mg`,
                fat_saturated: `${Math.round((primaryItem.fat_saturated_g || 0) * 10) / 10}g`,
                health_benefits: benefits,
                fun_fact: fact,
                all_items: items
            };

            setResult(formattedResult);

            setSaved(false);
            if (user) {
                try {
                    const { error: insertError } = await supabase.from('food_analysis_history').insert([{
                        user_id: user.id,
                        type: 'calorie_search',
                        filename: normalized,
                        search_query: normalized,
                        results: items.map(item => ({
                            name: item.name,
                            label: item.name,
                            calories: item.calories,
                            protein_g: item.protein_g,
                            carbohydrates_total_g: item.carbohydrates_total_g,
                            fat_total_g: item.fat_total_g,
                            serving_size_g: item.serving_size_g
                        })),
                        total_calories: totalCalories,
                        created_at: new Date().toISOString()
                    }]);
                    if (!insertError) setSaved(true);
                    else console.warn('Supabase save error:', insertError.message);
                } catch (e) { console.warn('Could not save to Supabase:', e); }
            }
        } catch (err) {
            console.error('CalorieNinjas API Error:', err);
            setError(`Failed to fetch nutritional data: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        searchCalories();
    };

    return (
        <div className="calorie-page">
            <section className="calorie-hero">
                <div className="container">
                    <div className="calorie-hero__badge">
                        <Sparkles size={14} /> Powered by CalorieNinjas API
                    </div>
                    <h1 className="animate-fade-in-up">
                        Calorie <span className="text-gradient">Calculator</span>
                    </h1>
                    <p className="calorie-hero__subtitle animate-fade-in-up delay-100">
                        Search any fruit or food product to get detailed calorie and nutritional information.
                    </p>

                    <form className="calorie-search animate-fade-in-up delay-200" onSubmit={handleSubmit}>
                        <div className="calorie-search__input-wrap">
                            <Search size={20} className="calorie-search__icon" />
                            <input
                                type="text"
                                placeholder="Search foods... (e.g., Apple, 3lb carrots, chicken sandwich)"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="calorie-search__input"
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={loading || !query.trim()}>
                            {loading ? <Loader2 size={18} className="spin-icon" /> : <Search size={18} />}
                            {loading ? 'Searching...' : 'Search'}
                        </button>
                    </form>
                </div>
            </section>

            <section className="calorie-content section">
                <div className="container">
                    {/* Popular food quick select */}
                    {!result && !loading && (
                        <div className="popular-fruits animate-fade-in">
                            {foodCategories.map((category) => (
                                <div key={category.label} style={{ marginBottom: '24px' }}>
                                    <h3>{category.label}</h3>
                                    <div className="popular-fruits__grid">
                                        {category.items.map((food, i) => (
                                            <button
                                                key={`${category.label}-${i}`}
                                                className="popular-fruit glass-card"
                                                onClick={() => {
                                                    setQuery(food.name);
                                                    searchCalories(food.name);
                                                }}
                                            >
                                                <span className="popular-fruit__emoji">{food.emoji}</span>
                                                <span className="popular-fruit__name">{food.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Loading State */}
                    {loading && (
                        <div className="calorie-loading">
                            <div className="calorie-loading__animation">
                                <span>🍎</span>
                                <span>🔍</span>
                                <span>📊</span>
                            </div>
                            <p>Fetching nutritional data from CalorieNinjas...</p>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="calorie-error glass-card">
                            <p>❌ {error}</p>
                        </div>
                    )}

                    {/* Results */}
                    {result && (
                        <div className="calorie-result animate-scale-in">
                            <div className="calorie-result__header">
                                <h2>{result.name}</h2>
                                <span className="calorie-result__serving">{result.serving_size}</span>
                            </div>

                            <div className="calorie-result__main-stats">
                                <div className="calorie-stat calorie-stat--calories">
                                    <div className="calorie-stat__value">{result.calories}</div>
                                    <div className="calorie-stat__label">Calories</div>
                                    <div className="calorie-stat__unit">kcal</div>
                                </div>
                                <div className="calorie-stat">
                                    <div className="calorie-stat__value">{result.protein}g</div>
                                    <div className="calorie-stat__label">Protein</div>
                                </div>
                                <div className="calorie-stat">
                                    <div className="calorie-stat__value">{result.carbs}g</div>
                                    <div className="calorie-stat__label">Carbs</div>
                                </div>
                                <div className="calorie-stat">
                                    <div className="calorie-stat__value">{result.fat}g</div>
                                    <div className="calorie-stat__label">Fat</div>
                                </div>
                            </div>

                            <div className="calorie-result__details">
                                <div className="calorie-detail glass-card">
                                    <h4>Detailed Nutrients</h4>
                                    <div className="calorie-detail__list">
                                        <div className="calorie-detail__item">
                                            <span>Fiber</span><span>{result.fiber}g</span>
                                        </div>
                                        <div className="calorie-detail__item">
                                            <span>Sugar</span><span>{result.sugar}g</span>
                                        </div>
                                        <div className="calorie-detail__item">
                                            <span>Saturated Fat</span><span>{result.fat_saturated}</span>
                                        </div>
                                        <div className="calorie-detail__item">
                                            <span>Sodium</span><span>{result.sodium}</span>
                                        </div>
                                        <div className="calorie-detail__item">
                                            <span>Potassium</span><span>{result.potassium}</span>
                                        </div>
                                        <div className="calorie-detail__item">
                                            <span>Cholesterol</span><span>{result.cholesterol}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="calorie-detail glass-card">
                                    <h4>Health Benefits</h4>
                                    <ul className="calorie-benefits">
                                        {result.health_benefits?.map((benefit, i) => (
                                            <li key={i}>✅ {benefit}</li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="calorie-detail glass-card calorie-fun-fact">
                                    <h4>💡 Fun Fact</h4>
                                    <p>{result.fun_fact}</p>
                                </div>
                            </div>

                            {/* Multi-item results */}
                            {result.all_items && result.all_items.length > 1 && (
                                <div className="calorie-multi glass-card" style={{ marginTop: '20px', padding: '20px' }}>
                                    <h4>All Items in Query</h4>
                                    <table className="upload-results__table" style={{ marginTop: '12px' }}>
                                        <thead>
                                            <tr>
                                                <th>Item</th>
                                                <th>Serving</th>
                                                <th>Calories</th>
                                                <th>Protein</th>
                                                <th>Carbs</th>
                                                <th>Fat</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {result.all_items.map((item, i) => (
                                                <tr key={i}>
                                                    <td style={{ textTransform: 'capitalize' }}>{item.name}</td>
                                                    <td>{item.serving_size_g}g</td>
                                                    <td>{item.calories}</td>
                                                    <td>{item.protein_g}g</td>
                                                    <td>{item.carbohydrates_total_g}g</td>
                                                    <td>{item.fat_total_g}g</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            <button
                                className="btn btn-secondary"
                                onClick={() => { setResult(null); setQuery(''); }}
                                style={{ marginTop: '24px' }}
                            >
                                Search Another Food
                            </button>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
