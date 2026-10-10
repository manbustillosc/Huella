# Valores de referencia calculados con la implementación independiente del paquete PyPI «medcalc» 0.4.0
# (funciones copiadas tal cual del archivo medcalc/__main__.py), para contrastar la de Huella.
import json
def egfr_epi(scr, age, male):
    k = 0.9 if male else 0.7
    a = -0.302 if male else -0.241
    return 142 * (0.9938 ** age) * (min(scr / k, 1) ** a) * (max(scr / k, 1) ** -1.2) * (1 if male else 1.012)
def crcl(age, weight, scr, female):
    c = (140 - age) * weight
    if female: c *= 0.85
    return c / (72 * scr)
def ibw(height_in, male):
    return (50 if male else 45.5) + 2.3 * (height_in - 60)
casos_tfg = []
for scr in [0.4, 0.6, 0.7, 0.9, 1.0, 1.3, 2.0, 4.5]:
    for age in [18, 45, 70, 85, 100]:
        for male in [True, False]:
            casos_tfg.append([scr, age, male, round(egfr_epi(scr, age, male), 4)])
casos_cg = []
for age in [65, 80, 95]:
    for w in [45, 70, 110]:
        for scr in [0.6, 1.0, 2.2]:
            for female in [True, False]:
                casos_cg.append([age, w, scr, female, round(crcl(age, w, scr, female), 4)])
casos_ibw = [[h, m, round(ibw(h / 2.54, m), 4)] for h in [152.4, 160, 170, 185] for m in [True, False]]
print(json.dumps({"tfg": casos_tfg, "cg": casos_cg, "ibw": casos_ibw}))
