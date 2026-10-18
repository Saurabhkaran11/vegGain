// Bay Area shopping guide (server component). Store lists change; check each store's site before a trip.

const STORES = [
  { cuisine: "Everyday staples", where: "Costco, Trader Joe’s, Safeway, Whole Foods, Sprouts", buy: "Tofu, Greek yogurt, cottage cheese, frozen edamame and berries, oats, peanut butter, hemp seeds, soy chorizo, frozen falafel" },
  { cuisine: "Indian", where: "India Cash & Carry (Foster City, Sunnyvale and more), neighborhood Indian grocers", buy: "Paneer, dals, soya chunks, sattu, atta, spices, curd" },
  { cuisine: "Chinese & Thai", where: "99 Ranch Market (Foster City and many Bay Area stores)", buy: "Fresh and pressed tofu, doubanjiang, black vinegar, Thai curry paste, Thai basil, jasmine rice, noodles" },
  { cuisine: "Korean", where: "H Mart (Fremont, Dublin and other Bay Area stores), 99 Ranch", buy: "Kimchi (check for a vegan one), gochujang, gochugaru, misugaru, soybean sprouts, somyeon" },
  { cuisine: "Japanese", where: "Nijiya Market, Mitsuwa (San Jose)", buy: "Miso, wakame, nori, short-grain rice, matcha, silken tofu" },
  { cuisine: "Mexican", where: "Latino markets, plus Safeway, Costco and Trader Joe’s", buy: "Corn tortillas, pinto and black beans, queso fresco, salsa, chili-lime seasoning, jicama" },
  { cuisine: "Mediterranean & Italian", where: "Trader Joe’s, Costco, Safeway, Middle Eastern markets", buy: "Hummus, feta, chickpeas, pita, chickpea pasta, marinara, Parmesan, tahini" },
  { cuisine: "Fresh produce", where: "Farmers markets (for example the Saturday market at College of San Mateo, and the Ferry Plaza market in San Francisco)", buy: "Seasonal fruit and vegetables, often cheaper and fresher in season" },
];

export function BayAreaStores() {
  return (
    <section className="block" aria-labelledby="stores">
      <div className="shead">
        <div><p className="eyebrow">Where to shop</p><h2 id="stores">Bay Area stores by cuisine</h2></div>
        <p>Every ingredient on the menu is available in these stores. Locations and stock change, so check a store’s website before you go.</p>
      </div>
      <div className="panel scroll">
        <table>
          <thead><tr><th scope="col">Cuisine</th><th scope="col">Where</th><th scope="col">What to buy there</th></tr></thead>
          <tbody>
            {STORES.map((s) => (
              <tr key={s.cuisine}><th scope="row">{s.cuisine}</th><td>{s.where}</td><td>{s.buy}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
