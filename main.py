import pandas as pd

# Lire le CSV
df = pd.read_csv("data.csv")

# Calculer la moyenne de la colonne "age"
moyenne_age = df["age"].mean()

# Afficher le résultat
print("Moyenne des âges :", moyenne_age)
