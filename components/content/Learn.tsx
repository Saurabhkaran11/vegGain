// Server components

export function Chefs() {
  return (
    <section className="block" id="chefs">
      <div className="panel cta-panel">
        <div><h3>Popular chefs and their latest vegetarian videos</h3><p>Sanjeev Kapoor, Ranveer Brar, Kunal Kapur, Nisha Madhulika, Hebbar’s Kitchen, Maangchi and 14 more, refreshed from YouTube every time the app starts, with every VegGain recipe in their cuisine.</p></div>
        <a className="btn add" href="/chefs">Open the Chefs pages →</a>
      </div>
    </section>
  );
}

export function LearnEarn() {
  return (
  <section className="block" id="learn">
    <div className="shead"><div><p className="eyebrow">Learn &amp; earn</p><h2>YouTube guides, resources and business ideas</h2></div>
      <p>Free options are listed first, then the best paid option. Each meal card also has its own YouTube recipe link.</p></div>
    <div className="cols">
      <div className="panel">
        <h3>YouTube channels to cook along with</h3>
        <ul>
          <li><a href="https://www.youtube.com/@hebbars.kitchen" target="_blank" rel="noopener noreferrer">Hebbar's Kitchen</a>: fast Indian vegetarian recipes, including moong dal chilla and paneer bhurji</li>
          <li><a href="https://www.youtube.com/@RanveerBrar" target="_blank" rel="noopener noreferrer">Chef Ranveer Brar</a>: Indian classics like rajma and dal tadka</li>
          <li><a href="https://www.youtube.com/@nishamadhulika" target="_blank" rel="noopener noreferrer">Nisha Madhulika</a>: home-style vegetarian cooking in Hindi</li>
          <li><a href="https://www.youtube.com/@YourFoodLab" target="_blank" rel="noopener noreferrer">Your Food Lab</a>: Indian street-style and high-protein ideas</li>
          <li><a href="https://www.youtube.com/results?search_query=Maangchi" target="_blank" rel="noopener noreferrer">Maangchi</a>: Korean home cooking, including dubu kimchi and kongguksu</li>
          <li><a href="https://www.youtube.com/results?search_query=Chinese+Cooking+Demystified" target="_blank" rel="noopener noreferrer">Chinese Cooking Demystified</a>: authentic Chinese technique, including mapo tofu and smashed cucumber</li>
          <li><a href="https://www.youtube.com/@RainbowPlantLife" target="_blank" rel="noopener noreferrer">Rainbow Plant Life</a>: vegan cooking with protein-rich bowls</li>
          <li><a href="https://www.youtube.com/@Simnettnutrition" target="_blank" rel="noopener noreferrer">Simnett Nutrition</a>: building muscle on a vegan diet</li>
          <li><a href="https://www.youtube.com/@BeerBiceps" target="_blank" rel="noopener noreferrer">BeerBiceps</a>: Indian vegetarian bodybuilding diet videos</li>
          <li><a href="https://www.youtube.com/@JeffNippard" target="_blank" rel="noopener noreferrer">Jeff Nippard</a>: evidence-based protein and training</li>
        </ul>
      </div>
      <div className="panel">
        <h3>Earn from YouTube</h3>
        <ul>
          <li><b>Now:</b> YouTube Partner Program needs 1,000 subscribers plus 4,000 public watch hours in 12 months, or 10M Shorts views in 90 days.</li>
          <li><b>From 1 Feb 2027:</b> new applicants need 8,000 watch hours or 20M Shorts views, plus 1,000 subscribers. Plan long-form meal-prep videos for watch hours.</li>
          <li><b>Early tier:</b> 500 subscribers unlocks memberships, Super Thanks and Shopping.</li>
          <li><b>Other income:</b> sponsorships, affiliate links, and selling your own meal-plan ebook.</li>
        </ul>
        <div className="linkrow"><a href="https://support.google.com/youtube/answer/72851" target="_blank" rel="noopener noreferrer">YPP overview</a><a href="https://support.google.com/youtube/answer/12843009" target="_blank" rel="noopener noreferrer">2027 changes</a></div>
      </div>
      <div className="panel">
        <h3>Nutrition and build resources</h3>
        <ul>
          <li><span className="pill">Free</span> <a href="https://fdc.nal.usda.gov/" target="_blank" rel="noopener noreferrer">USDA FoodData Central</a> nutrient database</li>
          <li><span className="pill">Free</span> <a href="https://www.nin.res.in/dietaryguidelines/pdfjs/locale/DGI_2024.pdf" target="_blank" rel="noopener noreferrer">ICMR-NIN Dietary Guidelines for Indians 2024</a></li>
          <li><span className="pill">Free</span> <a href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5477153/" target="_blank" rel="noopener noreferrer">ISSN protein position stand</a></li>
          <li><span className="pill">Free</span> <a href="https://ods.od.nih.gov/factsheets/VitaminB12-HealthProfessional/" target="_blank" rel="noopener noreferrer">NIH B12 fact sheet</a></li>
          <li><span className="pill">Free</span> <a href="https://cronometer.com/" target="_blank" rel="noopener noreferrer">Cronometer</a> tracker (free tier)</li>
          <li><span className="pill">Free</span> <a href="https://pages.github.com/" target="_blank" rel="noopener noreferrer">GitHub Pages</a> or <a href="https://app.netlify.com/drop" target="_blank" rel="noopener noreferrer">Netlify Drop</a> hosting</li>
          <li><span className="pill paid">Paid</span> Cronometer Gold (about $10.99/month)</li>
          <li><span className="pill paid">Paid</span> <a href="https://www.netlify.com/pricing/" target="_blank" rel="noopener noreferrer">Netlify Pro</a> or <a href="https://vercel.com/pricing" target="_blank" rel="noopener noreferrer">Vercel Pro</a> ($20/month) once you sell</li>
        </ul>
      </div>
      <div className="panel">
        <h3>Business ideas</h3>
        <ul>
          <li><b>Meal-prep boxes</b> of these Indian and vegan meals for gym members. Take pre-orders with <a href="https://stripe.com/payments/payment-links" target="_blank" rel="noopener noreferrer">Stripe Payment Links</a>; you need a permitted commercial kitchen.</li>
          <li><b>Meal-plan ebook</b> of the 16 recipes plus the 8-week plan on <a href="https://gumroad.com/" target="_blank" rel="noopener noreferrer">Gumroad</a>.</li>
          <li><b>YouTube channel</b> on high-protein Indian vegetarian meal prep with macros and cost on screen.</li>
          <li><b>Affiliate links</b> for kitchen gear via <a href="https://affiliate-program.amazon.com/" target="_blank" rel="noopener noreferrer">Amazon Associates</a> and protein via <a href="https://us.myprotein.com/c/about-us/ways-to-work-with-us/affiliated-partners/" target="_blank" rel="noopener noreferrer">Myprotein affiliates</a>. Always disclose.</li>
          <li><b>Nutrition app</b>: turn this page into a subscription app with saved days and weight tracking.</li>
        </ul>
      </div>
    </div>
  </section>
  );
}

export function RunDeploy() {
  return (
<section className="block" id="run">
      <div className="shead"><div><p className="eyebrow">Run it yourself</p><h2>Set up, run and deploy</h2></div></div>
      <div className="cols">
        <div className="panel"><h3>Run locally</h3>
          <p>Needs Node.js 20.9 or newer.</p>
          <pre>{`cd veggain8
npm install
npm run dev
# open http://localhost:3000`}</pre>
          <p className="muted">Production check: <code>npm run build</code> then <code>npm start</code>.</p></div>
        <div className="panel"><h3>Deploy free on Vercel</h3>
          <ul><li>Push the folder to a GitHub repo</li><li>Import it at <a href="https://vercel.com/new" target="_blank" rel="noopener noreferrer">vercel.com/new</a>; Next.js is detected automatically</li><li>Or run <code>npx vercel</code> from the folder</li><li>Hobby plan is free for personal, non-commercial use</li></ul></div>
        <div className="panel"><h3>Go commercial</h3>
          <ul><li>Upgrade to <a href="https://vercel.com/pricing" target="_blank" rel="noopener noreferrer">Vercel Pro</a> ($20/month) once you sell plans or meal boxes</li><li>Connect a custom domain in the Vercel dashboard</li><li>Edit meals, prices and YouTube searches in <code>lib/meals.ts</code></li></ul></div>
      </div>
    </section>
  );
}
