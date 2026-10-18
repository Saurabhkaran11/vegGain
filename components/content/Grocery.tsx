// Server component

export function GroceryList() {
  return (
  <section className="block" id="grocery">
    <div className="shead"><div><p className="eyebrow">Shopping</p><h2>Weekly grocery list and budget</h2></div>
      <p>About $65–80 per week in the US, or ₹2,000–2,300 per week on the Indian vegetarian plan (about ₹4,500 if tofu and tempeh heavy).</p></div>
    <div className="cols">
      <div className="panel"><h3>Protein</h3><ul><li>Tofu ×3 (16 oz), tempeh ×1, edamame</li><li>Paneer 600 g, soya chunks 250 g, sattu 500 g</li><li>Moong, toor and masoor dal; green lentils</li><li>Kidney beans, chickpeas, black beans</li><li>Greek yogurt 1.4 kg, cottage cheese, milk 2 L, fortified soy milk 2 L</li></ul></div>
      <div className="panel"><h3>Carbs</h3><ul><li>Oats 600 g, rice 1 kg, atta 1 kg</li><li>Whole-wheat bread, tortillas, pita, noodles</li><li>Quinoa, bananas ×10</li></ul></div>
      <div className="panel"><h3>Fats and seeds</h3><ul><li>Peanuts, peanut butter</li><li>Walnuts, almonds, chia, ground flax</li><li>Tahini, oil or ghee</li></ul></div>
      <div className="panel"><h3>Produce and pantry</h3><ul><li>Onion 2 kg, tomato 1.5 kg, spinach, peppers, cucumber</li><li>Frozen peas and berries, lemons, ginger, garlic, chillies, coriander</li><li>Spices, iodized salt, fortified nutritional yeast, soy sauce, salsa</li></ul></div>
    </div>
  </section>
  );
}
