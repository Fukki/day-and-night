String.prototype.clr = function (hexColor) { return `<font color="#${hexColor}">${this}</font>` }

const path = require('path');
const fs = require('fs');

const aero = ["VK_Aeroset.VK_SkyCastle00_AERO", "aen_aeroset.AERO.Serpent_Island_AERO_FINAL",
	"aen_aeroset.AERO.AEN_C_Misty_Island_Outdoor_AERO", "RNW_Aeroset_Various.AERO.Sunset_AERO",
	"atw_aeroset.AERO.SPR_Dawn_Garden_02_AERO", "lobby_ch_select_aero.AERO.Lobby_CH_Select_AERO_Night_02"
];

module.exports = function Cycles(mod) {
	let config = {}, isChanged = [], lastAero = 0, btime = 0, count = 0, bleb = null, otime = null, isInstance = false, isLobby = false;
	try {
		config = require('./config.json');
	} catch (e) {
		config = {
			Enable: true,
			Instance: false,
			cycleTime: 120000,
			loadTimeout: 1000,
			version: "Kappa :v"
		};
		saveConfig();
	}
	if (!config.loadTimeout) config.loadTimeout = 1000;
	btime = Math.floor(config.cycleTime/1000);
	
	mod.hook('S_LOAD_TOPO', 3, (e) => {enable(); if (!config.Instance) isInstance = (e.zone >= 9000);});

	mod.hook('C_LOAD_TOPO_FIN', 'raw', () => {if (lastAero > 0 && !isInstance) {cleanTimeout(); otime = setTimeout(function () {aeroSwitch(lastAero - 1, 5);}, config.loadTimeout);}});
	
	mod.hook("S_RETURN_TO_LOBBY", 'raw', () => {enable(); isLobby = true;});
	
	mod.hook("S_SPAWN_ME", 'raw', () => {enable(); isLobby = false;});
	
	function aeroChange(aeroSet, blendTime){
		isChanged[aeroSet] = enabled;
		mod.send('S_AERO', 1, {
			enabled: (enabled ? 1 : 0),
			blendTime: blendTime,
			aeroSet: aero[aeroSet]
		});
	}

	function aeroSwitch(aeroSet, blendTime = btime) {
		lastAero = aeroSet + 1;
		if (!isInstance && !isLobby) {
			for(i = 0; i < aero.length; i++) {
				if (i === aeroSet) aeroChange(i, blendTime, true);
				else if (isChanged[i]) aeroChange(i, blendTime, false);
			}
		}
	}
	
	function startTimer() {
		cleanTimer();
		bleb = setInterval(timer, config.cycleTime);
	}
	
	function cleanTimeout() {
		if (otime) {
			clearTimeout(otime);
			otime = null;
		}
	}
	
	function cleanTimer() {
		if (bleb) {
			clearInterval(bleb);
			bleb = null;
		}
	}

	function timer() {
		if (count < aero.length) {
			aeroSwitch(count);
			count++;
		} else {
			count = 0;
		}
	}

	if (config.Enable)
	mod.command.add('cycle', (arg) => {
		if(arg){
			if (!isNaN(arg)) {
				arg = Number(arg);
				if (bleb) {
					msg(`Please ${'disable'.clr('FF0000')} cycle before set.`);
				} else if (isInstance) {
					msg(`Aero for instance not enable`);
				} else if (arg < aero.length) {
					msg(`Time cycles set: ${arg}`);
					count = arg;
					aeroSwitch(arg, 5);
				} else {
					msg(`Please use 0 ~ ${(aero.length - 1)} for set.`);
				}
			} else {
				switch(arg.toLowerCase()) {
					case 'on':
						msg(`Time cycles: ${'enable'.clr('00FF33')}.`);
						startTimer();
						break;
					case 'off':
						msg(`Time cycles: ${'disable'.clr('FF0000')}.`);
						cleanTimer();
						break;
					default:
						msg(`Wrong command :v`);
						break;
				}
			}
		}
	});
	
	function enable() {if (config.Enable && !bleb) startTimer();}
	
	function msg(msg) {mod.command.message(msg);}

	function saveConfig() {
		fs.writeFile(path.join(__dirname, 'config.json'), JSON.stringify(
			config, null, 4), err => {
				console.log('[Cycles] - Config file generated.');
		});
	}
};