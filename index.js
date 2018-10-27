String.prototype.clr = function (hexColor) { return `<font color="#${hexColor}">${this}</font>` }

const path = require('path');
const fs = require('fs');

const aero = ["VK_Aeroset.VK_SkyCastle00_AERO", "aen_aeroset.AERO.Serpent_Island_AERO_FINAL",
	"aen_aeroset.AERO.AEN_C_Misty_Island_Outdoor_AERO", "RNW_Aeroset_Various.AERO.Sunset_AERO",
	"atw_aeroset.AERO.SPR_Dawn_Garden_02_AERO", "lobby_ch_select_aero.AERO.Lobby_CH_Select_AERO_Night_02"
];

module.exports = function Cycles(mod) {
	let config = {}, isChanged = [], lastAero = 0, btime = 0, count = 0, zoneBattleground = 0, bleb = null, otime = null, isInstance = false, isLobby = false, isBattleground = false, isCivilUnrest = false;
	try {
		config = require('./config.json');
	} catch (e) {
		config = {
			Enable: true,
			Instance: false,
			Battleground: false,
			CivilUnrest: false,
			cycleLock: 0,
			cycleTime: 120000,
			loadTimeout: 1000,
			version: "1d"
		};
		saveConfig();
	}
	if (config.version !== "1d") {
		config = {
			Enable: config.Enable ? config.Enable : false,
			Instance: config.Instance ? config.Instance : false,
			Battleground: config.Battleground ? config.Battleground : false,
			CivilUnrest: config.CivilUnrest ? config.CivilUnrest : false,
			cycleLock: config.cycleLock ? config.cycleLock : 0,
			cycleTime: config.cycleTime ? config.cycleTime : 120000,
			loadTimeout: config.loadTimeout ? config.loadTimeout : 1000,
			version: "1d"
		};
		saveConfig();
	}
	
	btime = Math.floor(config.cycleTime/1000);
	
	mod.hook('S_BATTLE_FIELD_ENTRANCE_INFO', 1, e => {zoneBattleground = e.zone});
	
	mod.hook('S_LOAD_TOPO', 3, (e) => {
		if (!config.Instance) isInstance = (e.zone >= 9000);
		if (!config.Battleground) isBattleground = (e.zone === zoneBattleground);
		if (!config.CivilUnrest) isCivilUnrest = (e.zone === 152);
		if (lastAero > 0) {
			cleanTimeout();
			otime = setTimeout(function () {
				isChanged = []; aeroSwitch(((config.cycleLock > 0) ? (config.cycleLock - 1) : (lastAero - 1)), 5);
			}, config.loadTimeout);
		}
		enable();
	});
	
	mod.hook("S_RETURN_TO_LOBBY", 'raw', () => {enable(); isLobby = true;});
	
	mod.hook("S_SPAWN_ME", 'raw', () => {enable(); isLobby = false;});
	
	function aeroChange(aeroSet, blendTime, enabled){
		isChanged[aeroSet] = enabled;
		mod.send('S_AERO', 1, {
			enabled: (enabled ? 1 : 0),
			blendTime: blendTime,
			aeroSet: aero[aeroSet]
		});
	}

	function aeroSwitch(aeroSet, blendTime = btime) {
		lastAero = aeroSet + 1;
		if (!isLobby && !isInstance && !isBattleground && !isCivilUnrest) {
			for(i = 0; i < aero.length; i++) {
				if (i === aeroSet) aeroChange(i, blendTime, true);
				else if (isChanged[i]) aeroChange(i, blendTime, false);
			}
		}
	}
	
	function startTimer() {cleanTimer(); bleb = setInterval(timer, config.cycleTime);}
	
	function cleanTimeout() {if (otime) {clearTimeout(otime); otime = null;}}
	
	function cleanTimer() {if (bleb) {clearInterval(bleb);bleb = null;}}

	function timer() {if (count < aero.length) {aeroSwitch(count); count++;} else {count = 0;}}

	if (config.Enable)
	mod.command.add('cycle', (arg1, arg2) => {
		if(arg1){
			switch(arg1.toLowerCase()) {
				case 'on':
					msg(`Time cycles: ${'enable'.clr('00FF33')}.`);
					startTimer();
					break;
				case 'off':
					msg(`Time cycles: ${'disable'.clr('FF0000')}.`);
					cleanTimer();
					break;
				case 'set':
					arg2 = Number(arg2);
					if (bleb) {
						msg(`Please ${'disable'.clr('FF0000')} cycle before set.`);
					} else if (isInstance) {
						msg(`Aero for Instance has not enable`);
					} else if (isBattleground) {
						msg(`Aero for Battleground has not enable`);
					} else if (isCivilUnrest) {
						msg(`Aero for Civil Unrest has not enable`);
					} else if (arg2 < aero.length) {
						msg(`Time cycles set: ${arg2}`);
						count = arg2; aeroSwitch(arg2, 5);
					} else {
						msg(`Please use 0 ~ ${(aero.length - 1)} for set.`);
					}
					break;
				case 'lock':
					arg2 = Number(arg2);
					if (arg2 < aero.length) {
						msg(`Time cycles lock to: ${arg2}`);
						config.cycleLock = arg2 + 1;
						count = arg2; aeroSwitch(arg2, 5);
						saveConfig();
					} else {
						msg(`Please use 0 ~ ${(aero.length - 1)} for lock.`);
					}
					break;
				case 'unlock':
					msg(`Time cycles has unlock.`);
					config.cycleLock = 0;
					saveConfig();
					break;
				case 'time':
				case 'timer':
					if (!isNaN(arg2)) {
						config.cycleTime = Number(arg2);
						msg(`Time cycles for timer set to: ${config.cycleTime} ms.`);
						saveConfig();
					} else {
						msg(`Must be the number.`);
					}
					break;
				case 'timeout':
				case 'loadtime':
				case 'loadtimeout':
					if (!isNaN(arg2)) {
						config.loadTimeout = Number(arg2);
						msg(`Time cycles for load time set to: ${config.loadTimeout} ms.`);
						saveConfig();
					} else {
						msg(`Must be the number.`);
					}
					break;
				case 'instance':
				case 'dungeon':
				case 'dg':
					if (isInstance) {
						msg(`Cannot set this while in Instance.`);
					} else {
						config.Instance = !config.Instance;
						msg(`Time cycles for Instance: ${config.Instance ? 'enable'.clr('00FF33') : 'disable'.clr('FF0000')}.`);
						saveConfig();
					}
					break;
				case 'battleground':
				case 'bg':
					if (isBattleground) {
						msg(`Cannot set this while in Battleground.`);
					} else {
						config.Battleground = !config.Battleground;
						msg(`Time cycles for Battleground: ${config.Battleground ? 'enable'.clr('00FF33') : 'disable'.clr('FF0000')}.`);
						saveConfig();
					}
					break;
				case 'civilunrest':
				case 'cu':
					if (isCivilUnrest) {
						msg(`Cannot set this while in Civil Unrest.`);
					} else {
						config.CivilUnrest = !config.CivilUnrest;
						msg(`Time cycles for Civil Unrest: ${config.CivilUnrest ? 'enable'.clr('00FF33') : 'disable'.clr('FF0000')}.`);
						saveConfig();
					}
					break;
				default:
					msg(`Wrong command :v`);
					break;
			}
		}
	});
	
	function msg(msg) {mod.command.message(msg);}
	
	function enable() {if (config.Enable && !bleb && config.cycleLock === 0) startTimer();}

	function saveConfig() {fs.writeFile(path.join(__dirname, 'config.json'), JSON.stringify(config, null, 4), err => {});}
};