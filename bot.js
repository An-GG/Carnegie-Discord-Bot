const botsettings = require("./botsettings.json");
const discord = require("discord.js");
var fs = require('fs');
var readline = require('readline');
const {google} = require('googleapis');
var googleAuth = require('google-auth-library');
var search = require('string-similarity');
var ontime = require('ontime');
var chrono = require('chrono-node');


// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/sheets.googleapis.com-nodejs-quickstart.json
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const TOKEN_PATH = 'token.json';


// Load client secrets from a local file.

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
 function authorize(credentials, callback) {
   const {client_secret, client_id, redirect_uris} = credentials.installed;
   const oAuth2Client = new google.auth.OAuth2(
       client_id, client_secret, redirect_uris[0]);

   // Check if we have previously stored a token.
   fs.readFile(TOKEN_PATH, (err, token) => {
     if (err) return getNewToken(oAuth2Client, callback);
     oAuth2Client.setCredentials(JSON.parse(token));
     callback(oAuth2Client);
   });
 }

 function getNewToken(oAuth2Client, callback) {
   const authUrl = oAuth2Client.generateAuthUrl({
     access_type: 'offline',
     scope: SCOPES,
   });
   console.log('Authorize this app by visiting this url:', authUrl);
   const rl = readline.createInterface({
     input: process.stdin,
     output: process.stdout,
   });
   rl.question('Enter the code from that page here: ', (code) => {
     rl.close();
     oAuth2Client.getToken(code, (err, token) => {
       if (err) return console.error('Error while trying to retrieve access token', err);
       oAuth2Client.setCredentials(token);
       // Store the token to disk for later program executions
       fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
         if (err) console.error(err);
         console.log('Token stored to', TOKEN_PATH);
       });
       callback(oAuth2Client);
     });
   });
 }
async function downloadHW(auth) {
  var sheets = google.sheets('v4');
  sheets.spreadsheets.values.get({
    auth: auth,
    spreadsheetId: '1jYqwvGVe5B7Dqh3uLgjRL01hEB6_t-sEQXVK49XybuE',
    range: "!A1:S6"
  }, function(err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    var rows = response.values;
    console.log(rows);
    let hw = reorg(rows);
    try {
      hwRetrieved(hw);
    } catch(error) {
      console.log(error);
    }
  });
}

function reorg(rows) {
  var fixedDir = {
    "dates" : [],
    "classes" : {

    }
  };
  for (var dayN in rows) {
    let day = rows[dayN];
    // If the Row (Day Basically) is not the top column, which contains the class names
    if (dayN > 0) {
      fixedDir.dates.push(day[0]);
      for (var assignN in day) {
        if (assignN > 0) {
          let assignText = day[assignN];
          try {
            fixedDir.classes[rows[0][assignN]].push(assignText);
          } catch(error) {
            console.log(fixedDir);
            console.log(error);
            return;
          }
        }
      }
    // If the Row (Day) is the top column and contains all the class names
    } else {
      for (var classNameN in day) {
        if (classNameN > 0) {
          let className = day[classNameN];
          fixedDir.classes[className] = [];
        }
      }
    }
  }
  console.log(fixedDir);
  return fixedDir;

}







const bot = new discord.Client({
  disableEveryone : true,
  autoReconnect : true
});

bot.on("error", async error => {
  console.log(error);
  console.log("bot was restarted");
  bot.login(botsettings.token);
})

bot.on("ready", () => {
  console.log("bot");
  console.log(bot.user.username);
  invite();
});

ontime({
    cycle: '07:00:00'
}, function (ot) {
    // do your job here
    let guilds = Array.from(bot.guilds);
    console.log(guilds);
    for (var guildNumber in guilds) {
      let guild = guilds[guildNumber][1];
      if (guild.name == botsettings.servername) {
        let channels = Array.from(guild.channels);
        console.log(channels);
        for (var k in channels) {
          let channel = channels[k][1];
          console.log(channel.name);
          if (channel.name == "announ") {

            // Get current date
            var date = new Date();
            var day = date.getDate();
            var month = (date.getMonth()).toString();
            var dateConstructor = month + "-" + day;
            var birthdays = JSON.parse(fs.readFileSync('birthday.json'));

            var todayBirthdays = [];
            for (user in birthdays) {
              if (birthdays[user] == dateConstructor) {
                todayBirthdays.push(user);
              }
            }

            var birthdayMessageConstruction = "Happy Birthday, "
            for (birthday in todayBirthdays) {
              if (birthday == 0) {
                birthdayMessageConstruction += todayBirthdays[birthday];
              } else if (birthday < todayBirthdays.length - 1) {
                birthdayMessageConstruction += ", " + todayBirthdays[birthday];
              } else {
                birthdayMessageConstruction += " and " + todayBirthdays[birthday];
              }
            }

            if (todayBirthdays.length == 0) {
              return;
            }
            channel.send(birthdayMessageConstruction).then(function(bDayMessage) {
              bDayMessage.react("🎂");
              bDayMessage.react("🎈");
              bDayMessage.react("🎉");
              bDayMessage.react("🎁");
              bDayMessage.react("🍰");
            });

          }
        }
      }
    }
    ot.done();
    return;
})


function sendWhisper(text) {
  var birthday = JSON.parse(fs.readFileSync('birthday.json', 'utf8'));
  console.log(birthday);
  var date = new Date();
  let day = date.getDate().toString();
  let month = (date.getMonth() + 1).toString();
  var dateConstructor =  month + "-" + day;
  console.log(dateConstructor);
  console.log(bot.user.id);
  let guilds = Array.from(bot.guilds);
  //console.log(guilds);
  for (var guildNumber in guilds) {
    let guild = guilds[guildNumber][1];
    if (guild.name == botsettings.servername) {
      let channels = Array.from(guild.channels);
      //console.log(channels);
      for (var k in channels) {
        let channel = channels[k][1];
        //console.log(channel.name);
        if (channel.name == "whisper") {
          channel.send("```Markdown\n" + "New Whisper \n#" + text + "\n```");
        }
      }
    }
  }
}
var globalchannel = null;
var globalFetchMessage = null;
var globalClassIdentifier = "";
function sendHW(channel, specificClassIdentifer) {
  let HWmessage = channel.send("Fetching Homework");
  globalFetchMessage = HWmessage;
  globalClassIdentifier = specificClassIdentifer;
  // Fetch Homework
  fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Google Sheets API.
    authorize(JSON.parse(content), downloadHW);
  });

}

function hwRetrieved(hw) {
  if (globalClassIdentifier == "all") {
    var construction = "";
    var indices = [];
    for (var className in hw.classes) {
      indices.push(construction.length);
      construction += "# " + className + "\n";
      let hwForClass = hw.classes[className];
      for (var hwN in hwForClass) {
        let individualAssign = hwForClass[hwN];
        if (individualAssign != "" && individualAssign != " ") {
          individualAssign = individualAssign.replace(/(\r\n|\n|\r)/gm," ");
          console.log(individualAssign);
          console.log(hw.dates);
          let date = hw.dates[hwN];
          construction += "  -("+ date + ") " + individualAssign + "\n";
        }
      }
    }
    construction += "*All content above is soley the work of Ankush Girotra and absolutely no one else, especially not that ape midget known as Daniel Lee.*";

    if (construction.length > 1800) {
      let mid = parseInt(indices.length / 2);
      console.log(mid);
      construction = [construction.substring(0, indices[mid]), construction.substring(indices[mid], construction.length)];
      //construction[0] += "\n```";
      //construction[1] = "```Markdown\n" + construction[1];
    } else {
      construction = [construction];
    }
    console.log(construction);
    for (var k in construction) {
      let constr = "```Markdown\n" + construction[k] + "\n```";
      globalchannel.send(constr);
    }
  } else {
    globalchannel.send("Specifc Class identifiers are currently not supported. Please use simply '@Carnegie hw' for now.")
  }
}


bot.on("message", async message => {
  if (message.author.bot) return;
  var currentMessage = message.content;
  if (message.channel.name == "whisper") {
    let construction = "```Markdown\n" + "New Whisper \n#" + currentMessage + "\n```";
    message.delete();
    message.channel.send(construction);
    return;
  }


  if (currentMessage.toLowerCase().indexOf('makhil') >= 0 || currentMessage.toLowerCase().indexOf('amacying') >= 0 || (currentMessage.toLowerCase().indexOf('macy') >= 0 && currentMessage.toLowerCase().indexOf('akhil') >= 0)) {
    message.channel.send(':heart:');
  }


  // Whisper Utility
  if (currentMessage.startsWith(' whisper') || currentMessage.startsWith('whisper')) {
    if (message.channel.type == "dm") {
      let content = message.content.split("whisper")[1];
      if (content === "" || content === " ") {
        message.channel.send("Your message is empty.");
        return;
      }
      sendWhisper(content);
      message.channel.send(":white_check_mark: Message sent to #whisper.");
      return;
    }
  }
  if (message.channel.type != "text") return;

  // WHAP Interface
  if (message.channel.name == "ush-interface") {
    // Get Interface Channel
    let channels = message.guild.channels.array();
    for (channelN in channels) {
      if (channels[channelN].name == 'apush-notif') {
        let channel = channels[channelN]
        channel.send(message.content);
      }
    }
  }

  // Tag Change Utility
  if (message.channel.name == "tag-change") {
    // Check For Proper Formatting
    if (message.content.startsWith("-")) {
      let request = message.content.substring(1);
      // Construct New username
      let curname = message.member.nickname;
      var firstInstance = curname.indexOf('[');
      var newName = "";
      if (firstInstance == -1) {
        newName = curname + " [" + request + "]";
        if (request == "") {
          message.channel.send("deadass you didn't put a nickname");
          return;
        }
      } else {
        newName = curname.substring(0,firstInstance + 1) + request + "]";
        if (request == "") {
          newName = curname.substring(0,firstInstance);
        }
      }
      if (newName.length > 31) {
        message.channel.send("Request is too long.");
        return;
      }
      message.guild.members.get(message.author.id).setNickname(newName);
      message.channel.send("Successfully Changed Nickname From " + curname + " to " + newName);
      return;

    } else {
      // Explain How the Formatting Works
      message.channel.send("To change your tag, send a message starting with '-' followed by your requested tag. For example:\n*-Supreme Lord Anthony*");
      message.delete();

    }
  }

  // Class Change Utility
  if (message.channel.name == "class-change") {
    // Check For Proper Formatting
    let officialRoles = botsettings.classRoles;

    if (message.content.startsWith("-list")) {
      let roles = message.member.roles.clone().array();
      var settingRoles = "";
      var onlyClassRoles = [];

      for (var roleN in roles) {
        let name = roles[roleN].name;
        for (var offN in officialRoles) {
          if (name == officialRoles[offN]) {
            // Add To Role Removal
            onlyClassRoles.push(roles[roleN]);
          }
        }
      }

      for (var roleN in onlyClassRoles) {
        let rolename = onlyClassRoles[roleN].name;
        if (onlyClassRoles.length == 1) {
          settingRoles += rolename;
        } else if (roleN != onlyClassRoles.length - 1) {
          settingRoles += rolename + ", ";
        } else {
          settingRoles += "and " + rolename;
        }
      }
      if (onlyClassRoles.length == 0) {
        settingRoles = "No Roles :b:";
      }
      message.channel.send(settingRoles);
    }

    else if (message.content.startsWith("-set") || message.content.startsWith("-add")) {
      var isAdding = false;
      if (message.content.startsWith("-add")) {
        isAdding = true;
      }
      let request = message.content.substring(4);
      let roleReq = request.split(",");


      var parsedRoles = [];
      for (var roleN in roleReq) {
        let req = roleReq[roleN];
        let matches = search.findBestMatch(req, officialRoles);
        let bestMatch = matches.bestMatch;
        parsedRoles.push(bestMatch.target);
      }
      console.log(roleReq);
      console.log(parsedRoles);
      if (request == " " || request == "") {
        parsedRoles = [];
      }
      console.log(parsedRoles);
      // Set Roles



      // First Remove All Class Roles
      let roles = message.member.roles.clone().array();
      let rolesToRemove = [];
      for (var roleN in roles) {
        let name = roles[roleN].name;
        for (var offN in officialRoles) {
          if (name == officialRoles[offN]) {
            // Add To Role Removal
            rolesToRemove.push(roles[roleN]);
          }
        }
      }
      message.member.removeRoles(rolesToRemove);

      // Add All Roles
      let allRoles = message.guild.roles.clone().array();
      let rolesToAdd = [];
      for (var prN in parsedRoles) {
        let name = parsedRoles[prN];
        for (var offN in officialRoles) {
          if (name == officialRoles[offN]) {
            // Add To Role Removal
            // Find The Role First, beacuse Official Roles is only a collection of Strings
            for (var roleN in allRoles) {
              if (name == allRoles[roleN].name) {
                rolesToAdd.push(allRoles[roleN]);
              }
            }
          }
        }
      }
      // If Adding, Combine Previous and New Roles
      if (isAdding) {
        for (previousRoleN in rolesToRemove) {
          let previousRole = rolesToRemove[previousRoleN];
          rolesToAdd.push(previousRole);
        }
      }


      // Check for Duplications
      let unDupedRolesToAdd = [];
      for (roleN in rolesToAdd) {
        let roleToAdd = rolesToAdd[roleN];
        var existsInSetAlready = false;
        for (unDupedN in unDupedRolesToAdd) {
          let unDupedRole = unDupedRolesToAdd[unDupedN];
          if (unDupedRole == roleToAdd) {
            existsInSetAlready = true;
          }
        }
        if (!existsInSetAlready) {
          unDupedRolesToAdd.push(roleToAdd);
        }
      }
      rolesToAdd = unDupedRolesToAdd;


      setTimeout(function() {
        message.member.addRoles(rolesToAdd);
      }, 500);

      //console.log(rolesToAdd);
      //console.log("||||||||||||||||||||||||||||||||||||||||");
      //console.log(rolesToRemove);

      // Send Confirmation Message

      let name = message.member.nickname;
      var settingRoles = "Setting " + name + "'s Class Roles From ";
      if (isAdding) {
        settingRoles = "Adding onto " + name + "'s Class Roles, Previously With ";
      }
      if (rolesToRemove.length == 0) {
        settingRoles += "Nothing";
      }
      for (var roleN in rolesToRemove) {
        let rolename = rolesToRemove[roleN].name;
        if (rolesToRemove.length == 1) {
          settingRoles += rolename;
        } else if (roleN != rolesToRemove.length - 1) {
          settingRoles += rolename + ", ";
        } else {
          settingRoles += "and " + rolename;
        }
      }
      if (isAdding) {
        settingRoles += "; now including "
      } else {
        settingRoles += " To ";
      }
      if (rolesToAdd.length == 0) {
        if (!isAdding) {
          settingRoles = "Removing All Your Class Roles";
        } else {
          settingRoles = "smh my head. why would you even -add if you weren't finna add nothing"
        }
      }
      for (var roleN in rolesToAdd) {
        let rolename = rolesToAdd[roleN].name;
        if (rolesToAdd.length == 1) {
          settingRoles += rolename;
        } else if (roleN != rolesToAdd.length - 1) {
          settingRoles += rolename + ", ";
        } else {
          settingRoles += "and " +rolename;
        }
      }
      message.channel.send(settingRoles);


    } else {
      // Explain How the Formatting Works
      message.channel.send("To change your Class Roles, type '-set' followed by a list of class names seperated by commas. Class names do not need to be specifc as a recognition algorithm is used. See list of all available roles in #usage. For example:\n**-set Whap Davis, BC Cehn, fisher price, semenar, gazzy garcia**\n*Response: Setting Ankush's Class Roles From Nothing To WHAP - Davis, PreCalcBC - Chen, English - Fischer, AP Seminar, and Chem - Garcia* \nTo add onto existing roles, use the -add command. \n\nUse -list to list your current class roles.");
      message.delete();

    }
    return;
  }


  // Bithdays
  if (message.channel.name == "birthday") {

    if (message.content.startsWith(botsettings.prefix)) {
      currentMessage = message.content.split(botsettings.prefix)[1];

      if (currentMessage == " " || "") {
        message.channel.send("Date not recognized");
        return;
      }

      // Load birthday list
      var birthdays = fs.readFileSync("birthday.json");
      birthdays = JSON.parse(birthdays);

      // Check if user already set birthday
      var userID = "<@" + message.author.id + ">";
      var firstTimeUser = true;
      for (user in birthdays) {
        if (userID == user) {
          firstTimeUser = false;
        }
      }


      if (firstTimeUser) {
        // Identify Date
        var chronoDate = chrono.parseDate(currentMessage);
        if (chronoDate == null) {
          message.channel.send("Date not recognized");
          return;
        }
        var dateString = chronoDate.getMonth().toString() + "-" + chronoDate.getDate().toString();
        // Set to disk
        birthdays[userID] = dateString;
        fs.writeFile('birthday.json', JSON.stringify(birthdays));

        // Completion Message
        message.channel.send('Birthday Set to ' + (chronoDate.getMonth() + 1).toString() + "-" + chronoDate.getDate().toString());
      } else {
        // Handle previously set user
        message.channel.send('Your birthday has previously been set. Please message an admin.')
      }



    } else {
      message.channel.send("*To set your birthday, mention the Carnegie bot followed by your birthday. For example:* \n<@408823818191110154> april 4th \n \n**WARNING: You can only set your birthday once. Do not try to trick the bot.**");
      message.delete();
    }
    return;
  }

  if (!message.content.startsWith(botsettings.prefix)) return;
  currentMessage = message.content.split(botsettings.prefix)[1];
  if (currentMessage.startsWith(" ")) {
    currentMessage = currentMessage.substring(1);
  }


  if (currentMessage.startsWith(' whisper') || currentMessage.startsWith('whisper')) {
    message.channel.send("Write ```whisper (super secret messsage)``` in a private DM to this bot to use whisper.")
    return;
  }

  // Homework Protocol
  if (currentMessage.startsWith("hw") || currentMessage.startsWith(" hw") || currentMessage.startsWith("homework") || currentMessage.startsWith(" homework")) {
    let channel = message.channel;
    globalchannel = channel;

    if (currentMessage.startsWith("hw") || currentMessage.startsWith(" hw")) {
      currentMessage = currentMessage.split('hw')[1];
    }
    if (currentMessage.startsWith("homework") || currentMessage.startsWith(" homework")) {
      currentMessage = currentMessage.split('homework')[1];
    }
    if (currentMessage == "" || currentMessage == " ") {
      try {
        sendHW(channel, "all");
      } catch(error) {
        console.log(error);
      }
    } else {
      sendHW(channel, currentMessage);
    }


    return;
  }

  // Delete
  var verified = false;
  if (currentMessage.startsWith("delete")) {
    let channel = message.channel;
    currentMessage = currentMessage.substring(7);
    // verify auth
    let roles = message.member.roles;
    let AuthRoleName = "gay nationalist";
    let allRoles = message.guild.roles.clone().array();

    for (roleN in allRoles) {
      if (allRoles[roleN].name == AuthRoleName) {
        verified = true;
      }
    }
    var nDelete = 0;
    if (verified) {
      nDelete = parseInt(currentMessage, 10);
      if (isNaN(nDelete)) {
        verifed = false;
      } else {
        if (nDelete > 99) {
          nDelete = 99;
        }
        if (nDelete < 0) {
          verified = false;
        }
      }
    }

    if (verified) {
      message.channel.fetchMessages({ limit: nDelete + 1 }).then(function(messages) {
        message.channel.bulkDelete(messages);
      });
    }
    return;
  }





  // Help
  if (currentMessage.startsWith(' help') || currentMessage.startsWith('help')) {
    message.channel.send("Commands: \n ```" + "@Carnegie" + " help - View Commands \n" + "@Carnegie" + " hw - Fetch Today's HW From Daniel's HW Calandar \n" + "(In Private DM) whisper [message]  - send anonymous message into the #whisper channel \n" + " ```");
    return;
  }

  return;
})

bot.on("guildMemberAdd", async member => {
  if (member.user.bot) return;
  let channels = await message.guild.channels;
  let chArr = Array.from(channels)

  for (var k in chArr) {
    let channel = chArr[k][1];
    if (channel.name == "visitors") {
      let visitorsChannel = channel;
      let authorID = member.user.id.toString();
      visitorsChannel.send("<@" + authorID + "> " + botsettings.welcomeMessage);
    }
  }
});

bot.login(botsettings.token);

async function invite() {
  let code = await bot.generateInvite(["ADMINISTRATOR"]);
  console.log(code);
}
