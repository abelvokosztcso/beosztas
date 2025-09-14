# Google Apps Script - Beosztás Emlékeztető Rendszer

## Áttekintés
Ez a Google Apps Script minden alkalom előtti napon 10:00-kor automatikusan küld egy emailt a szolgálattevőknek.

## Beállítási Lépések

### 1. Google Sheets Előkészítése
- Nyisd meg a Google Sheets fájlt, amely tartalmazza a beosztást
- Győződj meg róla, hogy a következő struktúra van beállítva:

**Táblázat 1 (Fő Beosztás):**
- A oszlop: esemény dátuma (YYYY-MM-DD formátumban)
- F-O oszlopok: feladat hozzárendelések
  - Első sor: feladat nevek (fejléc)
  - Többi sor: hozzárendelt személyek

**Táblázat 4 (Email Könyvtár):**
- A oszlop: név
- B oszlop: email cím

### 2. Apps Script Létrehozása
1. A Google Sheets-ben menj a **Bővítmények** > **Apps Script** menüre
2. Töröld a meglévő kódot
3. Másold be a `schedule_reminder.gs` fájl tartalmát
4. Mentsd el a projektet (Ctrl+S)

### 3. Trigger Beállítása
1. A Apps Script editorban válaszd ki a `setupDailyTrigger` függvényt
2. Kattints a **Futtatás** gombra
3. Engedélyezd a szükséges jogosultságokat:
   - Google Sheets hozzáférés
   - Gmail küldési jogosultság
4. A trigger automatikusan beállításra kerül 10:00-kor

### 4. Tesztelés
1. Válaszd ki a `testSendReminders` függvényt
2. Kattints a **Futtatás** gombra
3. Ellenőrizd a naplókat (Nézet > Naplók)
4. Ellenőrizd, hogy megérkeztek-e a teszt emailek

!!!!! Ilyenkor érdemes minden emailcím helyére beírnod a sajátodat, nehogy a tesztelés során mindenkinek küldj egy emailt.

## Funkciók

### Fő Funkciók
- **`sendDailyReminders()`**: Fő függvény, amely napi 10:00-kor fut
- **`findTomorrowsAssignments()`**: Megkeresi a holnapi esemény feladatait
- **`getEmailDirectory()`**: Betölti az email könyvtárat
- **`sendReminderEmail()`**: Elküldi az emlékeztető emaileket

### Segédfunkciók
- **`setupDailyTrigger()`**: Beállítja a napi triggert (le kell futtatni egyszer a setup során)
- **`testSendReminders()`**: Teszteléshez manuális futtatás
- **`checkTomorrowsAssignments()`**: Ellenőrzi a holnapi feladatokat

## Email Formátum

### Tárgy
```
Emlékeztető: holnapi beosztás
```

### Tartalom
- Személyes üdvözlés a névvel
- A holnapi dátum megjelenítése
- A személy feladatainak listázása
- HTML formázás

## Hibakezelés

A script a következő helyzeteket kezeli:
- Hiányzó email címek (csendes kihagyás)
- Hiányzó nevek
- Üres feladatok
- Hibás dátumok (?)
- Email küldési hibák

## Naplózás

A script részletes naplókat készít:
- Sikeres email küldések
- Hiányzó email címek
- Hibák és kivételek
- Futtatási statisztikák

## Testreszabás

### Email Könyvtár Helye
Ha az email könyvtár külön sheet-ben van:
1. Legyena  a tábla neve Személyek
2. A script automatikusan megtalálja

### Dátum Formátum
A script a következő formátumot várja: `YYYY.MM.DD`
Date formátum, nem text (tehát nem kell elé ' jel)


### Feladat Oszlopok
A feladatok az F-O oszlopokban vannak (6-15. oszlopok)

## Hibaelhárítás

### Gyakori Problémák

1. **Nem érkeznek emailek**
   - Ellenőrizd a trigger beállítását
   - Nézd meg a naplókat hibákért
   - Teszteld manuálisan a `testSendReminders` függvénnyel (ELŐTTE IRD ÁT AZ EMAIL LISTÁT)

2. **Hibás dátumok**
   - Győződj meg róla, hogy a dátumok YYYY.MM.DD. formátumban vannak
   - Ellenőrizd a timezone beállításokat

3. **Hiányzó email címek**
   - Ellenőrizd az email könyvtár struktúráját
   - Győződj meg róla, hogy a nevek pontosan egyeznek

4. **Jogosultsági hibák**
   - Engedélyezd a Google Sheets és Gmail hozzáférést
   

### Naplók Megtekintése
1. Apps Script editorban: **Nézet** > **Naplók**
2. Ellenőrizd a futtatási eredményeket
3. Keress hibákat a konzol üzenetekben

## Biztonság

- A script csak a saját Google Sheets és Gmail fiókodhoz fér hozzá
- Nincs külső hosting vagy harmadik fél szolgáltatás
- Minden adat a Google infrastruktúráján belül marad

## Támogatás

Ha problémáid vannak:
1. Ellenőrizd a naplókat
2. Teszteld a `checkTomorrowsAssignments` függvénnyel
3. Győződj meg róla, hogy a Google Sheets struktúra megfelelő
4. Ellenőrizd a jogosultságokat
