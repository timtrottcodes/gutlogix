# GutLogix

GutLogix is a lightweight food and symptom tracker designed to help people with IBS (Irritable Bowel Syndrome) identify patterns between their diet and digestive health. By logging meals, drinks, and symptoms, GutLogix provides detailed insights that make it easier to discover personal triggers and manage gut health more effectively.

👉 **Try it online:** [GutLogix Web App](http://timtrottcodes.github.io/gutlogix/)

---

## Features

* 📋 **Track Food & Drink**

  * Log foods and beverages quickly using a diary grid.
  * Select from a predefined list of foods or create new items with associated allergens.
  * Quantities and times are recorded for accurate tracking.

* ⚠️ **Track IBS Symptoms**

  * Log symptoms with severity (1–10) and frequency (once, hourly, constant).
  * Use a predefined symptom list or add custom symptoms.
  * Link symptoms to known allergens for deeper analysis.

* 🧩 **Relational Data Structure**

  * Foods are linked to allergens.
  * Allergens are linked to symptoms.
  * Diary entries link foods and symptoms to specific times.

* 📊 **Advanced Reporting**

  * Reports show correlations between foods, allergens, and observed symptoms.
  * Correlations are broken down by symptom type and severity.
  * Time-to-symptom is tracked to identify delayed reactions (e.g., lactose vs gluten).

* ✏️ **Editable Diary Entries**

  * Click an entry to edit it in a modal.
  * Hover to reveal a delete button for quick removal with confirmation.

* 💾 **Local-first & Privacy-friendly**

  * All data is stored securely in the browser using LocalStorage.
  * No external server or cloud service required.

* ⚡ **User-friendly Interface**

  * Hourly diary planner grid for intuitive logging.
  * Modal forms with dropdowns and autocomplete for allergens and foods.
  * Tag-based allergens for quick selection and easy linking.

---

## Tech Stack

* HTML, CSS, JavaScript
* Bootstrap (for responsive layout and modals)
* jQuery (for DOM manipulation and event handling)
* LocalStorage (offline-first storage)
* TomSelect (for autocomplete tags on allergens and foods)

---

## Getting Started

1. Clone or download this repository.
2. Open `index.html` in a modern web browser.
3. Start logging your meals, drinks, and symptoms.

---

## Best Practices for Logging

1. **Log Immediately:** Record foods and symptoms as soon as possible to ensure accurate time tracking.
2. **Include Quantity & Time:** Helps the report identify dose-dependent triggers.
3. **Use Existing Foods When Possible:** Select from previously entered foods to reduce typos and maintain consistency.
4. **Use Allergens Tags:** Assign allergens to foods to help the app identify potential triggers.
5. **Track Symptom Severity & Frequency:** Helps the reporting algorithm rank the most likely causes.
6. **Be Consistent:** Regular logging improves the quality of the correlation reports.

---

## Legal Disclaimer

**GutLogix is not a medical device.**
I am not a doctor, and this app does not provide medical advice. The information recorded and analyzed in this app is for **personal tracking purposes only**.

* Always consult a qualified healthcare professional regarding any symptoms or health concerns.
* This app was developed to log, monitor, and analyze my own IBS symptoms. Use at your own discretion.

---

## 📜 License

[![CC BY-NC-SA 4.0][cc-by-nc-sa-shield]][cc-by-nc-sa]

This work is licensed under a
[Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License][cc-by-nc-sa].

[![CC BY-NC-SA 4.0][cc-by-nc-sa-image]][cc-by-nc-sa]

[cc-by-nc-sa]: http://creativecommons.org/licenses/by-nc-sa/4.0/
[cc-by-nc-sa-image]: https://licensebuttons.net/l/by-nc-sa/4.0/88x31.png
[cc-by-nc-sa-shield]: https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg 
