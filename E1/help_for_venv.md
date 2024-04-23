Hi Sasha,

hier ist eine schnelle Anleitung wie du die venv von Python benutzen kannst. Habe jetzt auch alles mit homebrew gemacht und kann alles problemlos installieren:



1. Installiere dir die neuste Version von Python mit homebrew. Es ist wichtig, dass die komplett neu ist ohne librariers etc. Das cmd: `brew install python`
2. Dann im Projekt Ordner führ den cmd aus: `python3 -m venv infovis_venv`
3. Dann um ins venv zu gehen den: `source infovis_venv/bin/activate`
4. Dann um alle nötigen libaries zu installieren: `pip install -r requirements.txt`
5. Und wenn du eine neue Library installierst einfach das requirements file mit `pip freeze > requirements.txt ` updaten

