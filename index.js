String.prototype.clr = function (hexColor) { return `<font color="#${hexColor}">${this}</font>` }

const path = require('path');
const fs = require('fs');

const aero = ["VK_Aeroset.VK_SkyCastle00_AERO", "aen_aeroset.AERO.Serpent_Island_AERO_FINAL",
	"aen_aeroset.AERO.AEN_C_Misty_Island_Outdoor_AERO", "RNW_Aeroset_Various.AERO.Sunset_AERO",
	"atw_aeroset.AERO.SPR_Dawn_Garden_02_AERO", "lobby_ch_select_aero.AERO.Lobby_CH_Select_AERO_Night_02"
];

module.exports = function Cycles(mod) {
	let config = {}, btime = 0, count = 0, bleb = null, otime = null, isInstance = false, isChanged = [], lastAero = 0;
	try {
		config = require('./config.json');
	} catch (e) {
		config = {
			Enable: true,
			Instance: false,
			cycleTime: 120000,
			version: "1a"
		};
		saveConfig();
	}
	btime = Math.floor(config.cycleTime/1000);
	
	mod.hook('S_LOAD_TOPO', 3, (e) => {if (!config.Instance) isInstance = (e.zone >= 9000);});

	mod.hook('C_LOAD_TOPO_FIN', 1, () => {
		if (config.Enable && !bleb) startTimer();
		if (lastAero > 0) {
			cleanTimeout();
			otime = setTimeout(function () {aeroSwitch(lastAero - 1, 5);}, 1000);
		}
	});
	
	mod.hook("S_RETURN_TO_LOBBY", 'raw', () => {clearTimer(); cleanTimeout(); lastAero = 0; count = 0;});
	
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
		if (!isInstance) {
			for(i = 0; i < aero.length; i++) {
				if (i === aeroSet) aeroChange(i, blendTime, true);
				else if (isChanged[i]) aeroChange(i, blendTime, false);
			}
		}
	}
	
	function startTimer() {
		clearTimer();
		bleb = setInterval(timer, config.cycleTime);
	}
	
	function cleanTimeout() {
		if (otime) {
			clearTimeout(otime);
			otime = null;
		}
	}
	
	function clearTimer() {
		if (bleb || count > 0) {
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
				if (isInstance) {
					msg(`Aero for instance not enable`);
				} else if (bleb || count > 0) {
					msg(`Please ${'disable'.clr('FF0000')} time cycle before set aero.`);
				} else if (arg < aero.length) {
					msg(`Time cycles set: ${arg}`);
					aeroSwitch(arg, 0);
				}
			} else {
				switch(arg.toLowerCase()) {
					case 'on':
						msg(`Time cycles: ${'enable'.clr('00FF33')}.`);
						startTimer();
						break;
					case 'off':
						msg(`Time cycles: ${'disable'.clr('FF0000')}.`);
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
};