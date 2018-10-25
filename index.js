String.prototype.clr = function (hexColor) { return `<font color="#${hexColor}">${this}</font>` }

const path = require('path');
const fs = require('fs');

const aero = ["VK_Aeroset.VK_SkyCastle00_AERO", "aen_aeroset.AERO.Serpent_Island_AERO_FINAL",
	"aen_aeroset.AERO.AEN_C_Misty_Island_Outdoor_AERO", "RNW_Aeroset_Various.AERO.Sunset_AERO",
	"atw_aeroset.AERO.SPR_Dawn_Garden_02_AERO", "lobby_ch_select_aero.AERO.Lobby_CH_Select_AERO_Night_02"
];

module.exports = function Cycles(mod) {
	let count = 0, bleb = null, isInstance = false, isChanged = [];
	try {
		var config = require('./config.json');
	} catch (e) {
		var config = {
			onMapChange: true,
			onInstance: false,
			cycleTime: 120000,
			blendTime: 120,
			version: "1a"
		};
		saveConfig();
	}
	
	mod.hook('S_LOAD_TOPO', 3, (event) => {if (!config.onInstance) isInstance = (event.zone >= 9000);});

	mod.hook('C_LOAD_TOPO_FIN', 1, (event) => {if (config.onMapChange) startTimer();});

	mod.hook("S_RETURN_TO_LOBBY", 'raw', () => {clearTimer();});
	
	function aeroChanged(aeroSet, blendTime){
		isChanged[aeroSet] = enabled;
		mod.send('S_AERO', 1, {
			enabled: (enabled ? 1 : 0),
			blendTime: blendTime,
			aeroSet: aero[aeroSet]
		});
	}

	function aeroSwitch(aeroSet, blendTime = config.blendTime) {
		for(i = 0; i < aero.length; i++) {
			if (i === aeroSet) aeroChanged(i, blendTime, true);
			else if (isChanged[i]) aeroChanged(i, blendTime, false);
		}
	}
	
	function startTimer() {
		if (!isInstance) {
			clearTimer();
			bleb = setInterval(timer, config.cycleTime);
		}
	}
	
	function clearTimer() {
		if (bleb || count > 0) {
			clearInterval(bleb);
			bleb = null;
			count = 0;
		}
	}

	function timer() {
		if (isInstance) {
			clearTimer();
		} else {
			if (count < aero.length) {
				aeroSwitch(count);
				count++;
			} else {
				count = 0;
			}
		}
	}

	mod.command.add('cycle', (arg) => {
		if(arg){
			if (!isNaN(arg)) {
				arg = Number(arg);
				if (bleb || count > 0) {
					msg(`Please ${'deactivating'.clr('FF0000')} before set cycle.`);
				} else if (arg < aero.length) {
					msg(`Time cycles set: ${arg}`);
					aeroSwitch(arg, 0);
				}
			} else {
				switch(arg.toLowerCase()) {
					case 'on':
						msg(`Time cycles: ${'activated'.clr('00FF33')}.`);
						startTimer();
						break;
					case 'off':
						msg(`Time cycles: ${'deactivating'.clr('FF0000')}.`);
						clearTimer();
						break;
				}
			}
		}
	});
	
	function msg(msg){mod.command.message(msg);}

	function saveConfig() {
		fs.writeFile(path.join(__dirname, 'config.json'), JSON.stringify(
			config, null, 4), err => {
				console.log('[Cycles] - Config file generated.');
		});
	}

	this.destructor = () => {
		mod.command.remove('cycle');
	};
};