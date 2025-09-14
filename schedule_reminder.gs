/**
 * Daily Schedule Reminder Script
 * Runs at 10:00 AM daily to send reminder emails about tomorrow's assignments
 * 
 * Setup Instructions:
 * 1. Open Google Sheets with your schedule data
 * 2. Go to Extensions > Apps Script
 * 3. Replace the default code with this script
 * 4. Save the project
 * 5. Set up a daily trigger for 10:00 AM
 */

// Main function that will be triggered daily at 10:00 AM
function sendDailyReminders() {
  try {
    // Get the active spreadsheet
    const sheet = SpreadsheetApp.getActiveSheet();
    
    // Find tomorrow's event and get assignments
    const tomorrowAssignments = findTomorrowsAssignments(sheet);
    
    if (tomorrowAssignments.length === 0) {
      console.log('Nincs holnapi esemény a beosztásban.');
      return;
    }
    
    // Get email directory
    const emailDirectory = getEmailDirectory(sheet);
    
    // Group assignments by person
    const assignmentsByPerson = groupAssignmentsByPerson(tomorrowAssignments);
    
    // Send emails to each person
    let emailsSent = 0;
    for (const [personName, tasks] of assignmentsByPerson) {
      const email = emailDirectory[personName];
      
      if (email) {
        const success = sendReminderEmail(email, personName, tasks);
        if (success) {
          emailsSent++;
          console.log(`Emlékeztető elküldve: ${personName} (${email})`);
        }
      } else {
        console.log(`Nincs email cím: ${personName}`);
      }
    }
    
    console.log(`Összesen ${emailsSent} emlékeztető email elküldve.`);
    
  } catch (error) {
    console.error('Hiba történt az emlékeztetők küldése során:', error);
  }
}

/**
 * Find tomorrow's event and extract all task assignments
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The spreadsheet sheet
 * @return {Array} Array of assignment objects
 */
function findTomorrowsAssignments(sheet) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Normalize tomorrow's date to start of day for comparison
  const tomorrowNormalized = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
  
  console.log(`Keresés holnapi eseményre: ${tomorrowNormalized.toDateString()}`);
  
  // Get all data from the sheet
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  
  // Find the row with tomorrow's date
  let tomorrowRowIndex = -1;
  for (let i = 0; i < values.length; i++) {
    const cellValue = values[i][0]; // Column A (date)
    if (cellValue) {
      // Check if it's a Date object
      if (cellValue instanceof Date) {
        // Normalize the cell date to start of day for comparison
        const cellDateNormalized = new Date(cellValue.getFullYear(), cellValue.getMonth(), cellValue.getDate());
        
        if (cellDateNormalized.getTime() === tomorrowNormalized.getTime()) {
          tomorrowRowIndex = i;
          break;
        }
      } else {
        // If it's text, try to parse it as a date
        const textValue = cellValue.toString().trim();
        const parsedDate = new Date(textValue);
        
        if (!isNaN(parsedDate.getTime())) {
          const parsedDateNormalized = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
          
          if (parsedDateNormalized.getTime() === tomorrowNormalized.getTime()) {
            tomorrowRowIndex = i;
            break;
          }
        }
      }
    }
  }
  
  if (tomorrowRowIndex === -1) {
    console.log(`Nem található esemény holnapra: ${tomorrowNormalized.toDateString()}`);
    return [];
  }
  
  // Get task headers (columns F-O, which are indices 5-14)
  const taskHeaders = [];
  for (let col = 5; col <= 14; col++) {
    if (values[0] && values[0][col]) {
      taskHeaders.push(values[0][col].toString().trim());
    }
  }
  
  // Extract assignments from tomorrow's row
  const assignments = [];
  const tomorrowRow = values[tomorrowRowIndex];
  
  for (let col = 5; col <= 14; col++) {
    const taskName = taskHeaders[col - 5];
    const assignedPerson = tomorrowRow[col];
    
    if (taskName && assignedPerson && assignedPerson.toString().trim() !== '') {
      assignments.push({
        task: taskName,
        person: assignedPerson.toString().trim(),
        date: tomorrowNormalized.toDateString()
      });
    }
  }
  
  console.log(`${assignments.length} feladat hozzárendelés találva holnapra.`);
  return assignments;
}

/**
 * Get email directory from Table 4 (assuming it's in a separate sheet or range)
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The spreadsheet sheet
 * @return {Object} Object mapping names to email addresses
 */
function getEmailDirectory(sheet) {
  // Try to find the email directory sheet
  const spreadsheet = sheet.getParent();
  let emailSheet = null;
  
  // Look for a sheet named "Email Directory" or similar
  const sheetNames = ['Személyek'];
  for (const name of sheetNames) {
    try {
      emailSheet = spreadsheet.getSheetByName(name);
      if (emailSheet) break;
    } catch (e) {
      // Sheet doesn't exist, continue
    }
  }
  
  // If no dedicated sheet found, assume Table 4 is in the same sheet
  if (!emailSheet) {
    emailSheet = sheet;
  }
  
  const emailDirectory = {};
  
  // Get data from the email directory
  const emailRange = emailSheet.getDataRange();
  const emailValues = emailRange.getValues();
  
  // Look for email directory data (name in column A, email in column B)
  for (let i = 0; i < emailValues.length; i++) {
    const name = emailValues[i][0];
    const email = emailValues[i][1];
    
    if (name && email && name.toString().trim() !== '' && email.toString().trim() !== '') {
      emailDirectory[name.toString().trim()] = email.toString().trim();
    }
  }
  
  console.log(`${Object.keys(emailDirectory).length} email cím betöltve a könyvtárból.`);
  return emailDirectory;
}

/**
 * Group assignments by person name
 * @param {Array} assignments - Array of assignment objects
 * @return {Map} Map of person names to their task arrays
 */
function groupAssignmentsByPerson(assignments) {
  const grouped = new Map();
  
  for (const assignment of assignments) {
    const personName = assignment.person;
    
    if (!grouped.has(personName)) {
      grouped.set(personName, []);
    }
    
    grouped.get(personName).push(assignment);
  }
  
  return grouped;
}

/**
 * Send reminder email to a person
 * @param {string} email - Recipient's email address
 * @param {string} personName - Person's name
 * @param {Array} tasks - Array of task assignments
 * @return {boolean} Success status
 */
function sendReminderEmail(email, personName, tasks) {
  try {
    const subject = 'Emlékeztető a holnapi szolgálatodról';
    
    // Format the date nicely
    const eventDate = new Date(tasks[0].date);
    const formattedDate = Utilities.formatDate(eventDate, Session.getScriptTimeZone(), 'yyyy. MMMM dd. (EEEE)');
    
    // Create task list HTML
    let taskListHtml = '';
    for (const task of tasks) {
      taskListHtml += `<li style="margin-bottom: 8px; padding: 8px; background-color: #f8f9fa; border-left: 4px solid #007bff; border-radius: 4px;">${task.task}</li>`;
    }
    
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
        <div style="background-color: #007bff; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Szolgálati Emlékeztető</h1>
        </div>
        
        <div style="padding: 30px; background-color: #f8f9fa; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
            Kedves <strong>${personName}</strong>!
          </p>
          
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
          A holnapi napon (<strong>${formattedDate}</strong>) az alábbi szolgálatokra vagy beosztva. Ha valamiért nem tudod vállalni az adott szolgálatot, kérlek, cseréld el valakivel és jelezd annak, aki a beosztást készíti.
          </p>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #007bff; margin-top: 0; margin-bottom: 15px; font-size: 18px;">
              A te szolgálataid:
            </h2>
            <ul style="list-style: none; padding: 0; margin: 0;">
              ${taskListHtml}
            </ul>
          </div>
          
       
        </div>
        
        <div style="text-align: center; margin-top: 20px; padding: 15px; background-color: #e9ecef; border-radius: 8px;">
          <p style="font-size: 12px; color: #6c757d; margin: 0;">
            Ez egy automatikus emlékeztető email a beosztási rendszertől. Ha valamilyen hibát észlesz kérlek keress a hegelyabel@gmail.com címen. Erre az üzenetre ne válaszolj!
          </p>
        </div>
      </div>
    `;
    
    // Send the email
    GmailApp.sendEmail(email, subject, '', {
      htmlBody: htmlBody,
      name: 'Beosztási Rendszer'
    });
    
    return true;
    
  } catch (error) {
    console.error(`Hiba az email küldése során (${email}):`, error);
    return false;
  }
}

/**
 * Setup function to create the daily trigger
 * Run this function once to set up the daily trigger
 */
function setupDailyTrigger() {
  // Delete existing triggers for this function
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'sendDailyReminders') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  

//ITT LEHET ÁLLÍTANI HOGY MIKOR KÜLDJE
//nincs atMinute() függvény


  // Create new daily trigger for 10:00 AM
  ScriptApp.newTrigger('sendDailyReminders')
    .timeBased()
    .everyDays(1)
    .atHour(10) //inkább legyen kicsit kesobb 10kor, nehogy valakit zavarjon eggel
    .create();
  
  console.log('Napi trigger beállítva 10:00-kor a sendDailyReminders függvényhez.');
}

/**
 * Test function to manually send reminders for tomorrow
 * Use this to test the script without waiting for the trigger
 */
function testSendReminders() {
  console.log('Teszt futtatás indítása...');
  sendDailyReminders();
}

/**
 * Function to check what assignments exist for tomorrow
 * Useful for debugging and verification
 */
function checkTomorrowsAssignments() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const assignments = findTomorrowsAssignments(sheet);
  
  console.log('Holnapi feladatok:');
  assignments.forEach(assignment => {
    console.log(`- ${assignment.person}: ${assignment.task}`);
  });
  
  return assignments;
}
