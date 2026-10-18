import { agentStatus, fmtDate } from "@/lib/data";

export function Footer() {
  return (
<footer className="wrap">
  <p><b>Not medical advice.</b> This is educational information. Food supports health but does not cure disease. Talk to a doctor or registered dietitian before changing your diet or taking supplements (B12, iron, vitamin D, algae DHA, creatine), especially if you have kidney, liver or thyroid conditions, diabetes, are pregnant, under 18, or take medicines. Allergens in these recipes: soy, dairy, gluten, peanuts, tree nuts and sesame. Macros are estimates from USDA and Indian food tables; costs are October 2026 estimates and vary by store.</p>
  <p className="foot-links"><b>Vegetarian</b> here means no meat, fish or eggs (dairy is included). <a href="/credits">Photo credits</a> · <a href="/agents">Data agents</a> (last refresh {fmtDate(agentStatus.lastRun)})</p>
</footer>
  );
}
