import json
from playwright.sync_api import sync_playwright

B = json.load(open("/tmp/badges.json"))
SIDS = B["sids"]

def make_handler():
    def handler(route):
        url = route.request.url
        if "/rpc/enregistrer_passage" in url:
            corps = route.request.post_data_json or {}
            sid = corps.get("p_eleve_id", "")
            if sid == SIDS["valide"]:
                route.fulfill(json={"verdict": "vert", "code": "servi", "eleve": "Jean-Marc Yao",
                                    "classe_id": "cccccccc-cccc-4ccc-8ccc-cccccccccccc", "solde": 11})
            elif sid == SIDS["deja"]:
                route.fulfill(json={"verdict": "rouge", "code": "deja_servi",
                                    "eleve": "Aminata Traoré", "heure_premier_passage": "11:47"})
            elif sid == SIDS["inactif"]:
                route.fulfill(json={"verdict": "rouge", "code": "eleve_desactive", "eleve": "Olivier Kouamé"})
            else:
                route.fulfill(json={"verdict": "rouge", "code": "eleve_inconnu"})
        elif "/rest/v1/classes" in url:
            route.fulfill(json=[{"id": "cccccccc-cccc-4ccc-8ccc-cccccccccccc", "nom": "CM2 B"}])
        else:
            route.fulfill(json=[])
    return handler

checks = []

def scenario_camera_ok(b):
    pg = b.new_page(viewport={"width": 1440, "height": 1000})
    pg.add_init_script("window.__SC_TEST_CAMERA__=\"ok\"; window.__SC_TEST_QR__=[];")
    pg.route("**placeholder.supabase.co/**", make_handler())
    pg.goto("http://localhost:3000/scanner", wait_until="networkidle")
    pg.click("text=Activer la caméra")
    pg.wait_for_function("() => document.getElementById('poste-de-scan')?.dataset.etat === 'scanning'", timeout=6000)
    checks.append(("machine: idle -> scanning", True))

    def scanner(qr, attendu, libelle, capture=None):
        pg.evaluate("t => window.__SC_TEST_QR__.push(t)", qr)
        pg.wait_for_selector("[data-testid=verdict-plein-ecran]", timeout=5000)
        if capture:
            pg.screenshot(path=capture)
        texte = pg.locator("[data-testid=verdict-plein-ecran]").inner_text()
        checks.append((libelle, attendu in texte))
        pg.wait_for_function("() => document.getElementById('poste-de-scan')?.dataset.etat === 'scanning'", timeout=6000)
        return texte

    t = scanner(B["valide"], "SERVIR", "QR valide -> SERVIR", capture="/tmp/3b-vert.png")
    checks.append(("verdict complet nom+classe+solde", ("Jean-Marc Yao" in t) and ("CM2 B" in t) and ("11" in t)))
    scanner(B["deja"], "11:47", "deja servi -> REFUSER avec heure")
    scanner(B["inactif"], "désactivé", "eleve inactif -> rouge desactive")
    scanner(B["illisible"], "BADGE INVALIDE", "QR illisible -> BADGE INVALIDE")
    t = scanner(B["falsifie"], "BADGE INVALIDE", "signature invalide -> BADGE INVALIDE")
    checks.append(("detail falsification affiche", ("falsifié" in t) or ("Signature" in t)))
    corps = pg.inner_text("body")
    checks.append(("historique alimente", ("Badge falsifié" in corps) or ("QR non reconnu" in corps)))
    pg.close()

def scenario_camera(b, mode, attendu, libelle, capture=None):
    pg = b.new_page(viewport={"width": 1280, "height": 900})
    pg.add_init_script("window.__SC_TEST_CAMERA__=\"" + mode + "\";")
    pg.route("**placeholder.supabase.co/**", make_handler())
    pg.goto("http://localhost:3000/scanner", wait_until="networkidle")
    pg.click("text=Activer la caméra")
    pg.wait_for_selector("text=" + attendu, timeout=5000)
    checks.append((libelle, True))
    checks.append((libelle + " + bouton Reessayer", pg.locator("text=Réessayer").count() == 1))
    if capture:
        pg.screenshot(path=capture)
    pg.close()

with sync_playwright() as p:
    b = p.chromium.launch()
    scenario_camera_ok(b)
    scenario_camera(b, "refusee", "Accès caméra refusé", "camera refusee -> ecran erreur", capture="/tmp/3b-camera-refusee.png")
    scenario_camera(b, "indisponible", "Aucune caméra détectée", "camera indisponible -> ecran erreur")
    b.close()

for n, ok in checks:
    print(("PASS " if ok else "FAIL ") + n)
print("TOTAL:", str(sum(1 for _, ok in checks if ok)) + "/" + str(len(checks)))
