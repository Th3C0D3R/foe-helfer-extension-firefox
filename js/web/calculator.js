/*
 * **************************************************************************************
 *
 * Dateiname:                 calculator.js
 * Projekt:                   foe
 *
 * erstellt von:              Daniel Siekiera <daniel.siekiera@gmail.com>
 * zu letzt bearbeitet:       11.11.19, 20:24 Uhr
 *
 * Copyright © 2019
 *
 * **************************************************************************************
 */

let Calculator = {

    ArcBonus: 90,
    EntityOverview: [],
    CurrentPlayer: 0,
    Building: [],
    Places: [],
    SoundFile: new Audio('moz-extension://' + extID + '/vendor/sounds/message.mp3'),
    PlayerName: undefined,
    LastPlayerID: 0,
    PlayInfoSound: null,
    PlayOverviewInfoSound: null,

	/**
	 * Kostenrechner anzeigen
	 *
	 * @param Rankings
	 * @param UpdateEntity
	 * @param isOverview
	 * @constructor
	 */
    Show: (Rankings, UpdateEntity) => {

        // moment.js global setzen
        moment.locale(MainParser.Language);

        // Wenn die Box noch nicht da ist, neu erzeugen und in den DOM packen
        if ($('#costCalculator').length === 0) {
            let spk = localStorage.getItem('CalculatorTone');

            if (spk === null) {
                localStorage.setItem('CalculatorTone', 'deactivated');
                Calculator.PlayInfoSound = false;

            } else {
                Calculator.PlayInfoSound = (spk !== 'deactivated');
            }

            let ab = localStorage.getItem('CalculatorArcBonus');

            // alten Wert übernehmen, wenn vorhanden
            if (ab !== null) {
                Calculator.ArcBonus = parseFloat(ab);
            }

            let args = {
                'id': 'costCalculator',
                'title': i18n['Boxes']['Calculator']['Title'],
                'ask': i18n['Boxes']['Calculator']['HelpLink'],
                'auto_close': true,
                'dragdrop': true,
                'minimize': true,
                'speaker': 'CalculatorTone'
            };

            HTML.Box(args);

            Calculator.CurrentPlayer = parseInt(localStorage.getItem('current_player_id'));
        }

        let Overview = sessionStorage.getItem('OtherActiveBuildingOverview'),
			PlayerName,
            h = [],
            arc = ((parseFloat(Calculator.ArcBonus) + 100) / 100);


        // ab hier wurde ein einzelnes LG geöffnet
        Calculator.Places = Rankings;
        Calculator.Building = UpdateEntity;

        // Wenn sich Spieler geändert hat, dann BuildingName/PlayerName zurücksetzen
        if (UpdateEntity['player_id'] !== Calculator.LastPlayerID) {
            PlayerName = undefined;
        }
        
        // Übersicht vorhanden
        if (Overview !== null) {
            // Übersicht laden + passendes LG
            Calculator.EntityOverview = JSON.parse(Overview);

            let BuildingInfo = Calculator.EntityOverview.find(obj => {
                return obj['city_entity_id'] === UpdateEntity['cityentity_id'];
            });

            // Übersicht vom richtigen Spieler vorhanden => Spielername auslesen
            if (BuildingInfo !== undefined && BuildingInfo['player']['player_id'] === UpdateEntity['player_id']) {
                PlayerName = BuildingInfo['player']['name'];
            }
        }

        // BuildingName konnte nicht aus der BuildingInfo geladen werden
        let BuildingName = BuildingNamesi18n[UpdateEntity['cityentity_id']]['name'];
        
        h.push('<div class="text-center dark-bg" style="padding:5px 0 3px;">');

        // LG - Daten + Spielername
        h.push('<p class="header"><strong><span>' + BuildingName + '</span>' + (PlayerName !== undefined ? ' - ' + PlayerName : '') + ' </strong><br>' + i18n['Boxes']['Calculator']['Step'] + '' + UpdateEntity['level'] + ' &rarr; ' + (parseInt(UpdateEntity['level']) + 1) + '</p>');
        
        // FP im Lager
        h.push('<p>' + i18n['Boxes']['Calculator']['AvailableFP'] + ': <strong class="fp-storage">' + HTML.Format(StrategyPoints.AvailableFP) + '</strong></p>');

        h.push('<p class="costFactorWrapper">');

        h.push('<span>' + i18n['Boxes']['Calculator']['ArcBonus'] + ' - <input type="number" id="costFactor" step="' + (Calculator.ArcBonus > 80 ? '0.1' : '0.5') + '" min="12" max="200" value="' + Calculator.ArcBonus + '">%</span>');

        // Zusätzliche Buttons für die Standard Prozente
        let own_arc = '<button class="btn btn-default btn-default-active btn-toggle-arc" data-value="' + arc + '">' + Calculator.ArcBonus + '%</button>';

        // ... und korrekt einsortieren
        if (arc < 1.85) {
            h.push(own_arc);
        }

        if (arc !== 1.85) {
            h.push('<button class="btn btn-default btn-toggle-arc" data-value="1.85">85%</button>');
        }

        if (arc > 1.85 && arc < 1.9) {
            h.push(own_arc);
        }

        if (arc !== 1.9) {
            h.push('<button class="btn btn-default btn-toggle-arc" data-value="1.9">90%</button>');
        }

        if (arc >= 1.9) {
            h.push(own_arc);
        }
        
        h.push('</p>');

        h.push('</div>');
        
        // Tabelle zusammen fummeln
        h.push('<table id="costTable" class="foe-table">');

        h.push('<thead>' +
            '<tr>' +
            '<th>#</th>' +
            '<th>' + i18n['Boxes']['Calculator']['Earnings'] + '</th>' +
            '<th>BP</th>' +
            '<th>Meds</th>' +
            '<th>' + i18n['Boxes']['Calculator']['Commitment'] + '</th>' +
            '<th>' + i18n['Boxes']['Calculator']['Profit'] + '</th>' +
            '<th>' + i18n['Boxes']['Calculator']['Rate'] + '</th>' +
            '</tr>' +
            '</thead>');

        // "Blindfelder" gegen das "flackern" erzeugen
        h.push('<tbody>');
        for (let i = 1; i < 6; i++) {
            h.push('<tr><td><strong>' + i + '</strong></td><td>-</td><td>-</td><td>-<td><td>-</td><td></td></tr>');
        }
        h.push('</tbody>');

        h.push('</table>');


        // Wieviel fehlt noch bis zum leveln?
        let rest = (UpdateEntity['state']['invested_forge_points'] === undefined ? UpdateEntity['state']['forge_points_for_level_up'] : UpdateEntity['state']['forge_points_for_level_up'] - UpdateEntity['state']['invested_forge_points']);
        
        h.push('<div class="text-center" style="margin-top:5px;margin-bottom:5px;"><em>' + i18n['Boxes']['Calculator']['Up2LevelUp'] + ': <span id="up-to-level-up" style="color:#FFB539">' + HTML.Format(rest) + '</span> ' + i18n['Boxes']['Calculator']['FP'] + '</em></div>');


        // in die bereits vorhandene Box drücken
        $('#costCalculator').find('#costCalculatorBody').html(h.join(''));

        // Stufe ist noch nicht freigeschaltet
        if (UpdateEntity['level'] === UpdateEntity['max_level']) {
            $('#costCalculator').find('#costCalculatorBody').append($('<div />').addClass('lg-not-possible').attr('data-text', i18n['Boxes']['Calculator']['LGNotOpen']));

        } else if (UpdateEntity['connected'] === undefined) {
            $('#costCalculator').find('#costCalculatorBody').append($('<div />').addClass('lg-not-possible').attr('data-text', i18n['Boxes']['Calculator']['LGNotConnected']));
        }
                
        Calculator.CalcBody(arc);

        // alle Ansichten aktualisieren
        setTimeout(() => {
                StrategyPoints.ForgePointBar(StrategyPoints.AvailableFP);
            }, 200);
        
        // schnell zwischen den Prozenten wechseln
        $('body').on('click', '.btn-toggle-arc', function () {

            $('.btn-toggle-arc').removeClass('btn-default-active');

            let arc = $(this).data('value');
            Calculator.CalcBody(arc);

            $(this).addClass('btn-default-active');
        });


        // wenn der Wert des Archebonus verändert wird, Event feuern
        $('body').on('blur', '#costFactor', function () {

            let ab = parseFloat($('#costFactor').val());
            Calculator.ArcBonus = ab;

            localStorage.setItem('CalculatorArcBonus', ab);

            let arc = ((ab + 100) / 100);

            Calculator.CalcBody(arc);
        });

        $('body').on('click', '#CalculatorTone', function () {

            let disabled = $(this).hasClass('deactivated');

            localStorage.setItem('CalculatorTone', (disabled ? '' : 'deactivated'));
            Calculator.PlayInfoSound = !!disabled;

            if (disabled === true) {
                $('#CalculatorTone').removeClass('deactivated');
            } else {
                $('#CalculatorTone').addClass('deactivated');
            }
        });
    },


	/**
	 * Daten für die kleine Übersichtsbox aufbereiten
	 *
	 * @constructor
	 */
    ShowOverview: (DisableAudio) => {

        let Overview = sessionStorage.getItem('OtherActiveBuildingOverview'),
            arc = ((parseFloat(Calculator.ArcBonus) + 100) / 100);

        Calculator.ParseOverview(arc, JSON.parse(Overview), DisableAudio);
    },
       
	/**
	 * Der Tabellen-Körper mit allen Funktionen
	 *
	 * @param arc
	 * @constructor
	 */
	CalcBody: (arc)=> {
		let Rankings = Calculator.Places,
			UpdateEntity = Calculator.Building,
			h = [],
			BestKurs = 999999;

		h.push('<thead>' +
				'<th>#</th>' +
				'<th>'+ i18n['Boxes']['Calculator']['Earnings'] +'</th>' +
				'<th>BP</th>' +
				'<th>Meds</th>' +
				'<th>'+ i18n['Boxes']['Calculator']['Commitment'] +'</th>' +
				'<th>'+ i18n['Boxes']['Calculator']['Profit'] +'</th>' +
				'<th>'+ i18n['Boxes']['Calculator']['Rate'] +'</th>' +
            '</thead>');

        let EigenPos,
            EigenBetrag = 0;

        // Ränge durchsteppen, Suche nach Eigeneinzahlung
        for (let i in Rankings)
        {
            if (Rankings[i]['player']['player_id'] !== undefined && Rankings[i]['player']['player_id'] === Calculator.CurrentPlayer) {
                EigenPos = i;
                EigenBetrag = EingezahltAufRang = (isNaN(parseInt(Rankings[i]['forge_points']))) ? 0 : parseInt(Rankings[i]['forge_points']);
                break;
            }
        }

		// Ränge nochmals durchsteppen
        for (let i in Rankings)
		{
            if (Rankings.hasOwnProperty(i))
			{
				// hier sitzt der LG Besitzer drin oder der User wurde gelöscht
                if (Rankings[i]['rank'] === undefined || Rankings[i]['rank'] === -1)
				{
					continue;
				}

                let isSelf = (Rankings[i]['player']['player_id'] !== undefined && Rankings[i]['player']['player_id'] === Calculator.CurrentPlayer);

				// gibt es für diesen Platz FPs zurück?
                if (Rankings[i]['reward'] === undefined)
				{
					h.push('<tr>' +
                        '<td><strong>' + Rankings[i]['rank'] + '</strong></td>' +
						'<td colspan="6" class="text-center"><small><em>' + i18n['Boxes']['Calculator']['NoFPorMedsAvailable'] + '</em></small></td>' +
						'</tr>');
				}

				// Belohnung aber keine FP
                else if (Rankings[i]['reward'] !== undefined && Rankings[i]['reward']['strategy_point_amount'] === undefined) {

                    let blp = Rankings[i]['reward']['blueprints'] !== undefined ? Math.round(parseInt(Rankings[i]['reward']['blueprints']) * arc) : 0,
                        med = Rankings[i]['reward']['resources']['medals'] !== undefined ? Math.round(parseInt(Rankings[i]['reward']['resources']['medals']) * arc) : 0,
                        EingezahltAufRang = (isNaN(parseInt(Rankings[i]['forge_points']))) ? 0 : parseInt(Rankings[i]['forge_points']),
						trClass;

					// schon besetzt
                    if (EingezahltAufRang > 0)
					{
						trClass = ' class="text-grey"';
                    }

                    // Schon Einzahlung in höheren Rang vorhanden
                    else if ((EigenPos !== undefined && i > EigenPos)) {
                        trClass = ' class="text-grey"';
                    }

                    h.push('<tr' + trClass + '><td><strong>' + Rankings[i]['rank'] + '</strong></td>' +
						'<td class="text-center">' +
							'<strong class="'+ (isSelf ? 'info' : 'success') +'">0</strong>' +
						'</td>' +
						'<td class="text-center">' + HTML.Format(blp) + '</td>' +
						'<td class="text-center">' + HTML.Format(med) + '</td>');


                    if (isSelf && Rankings[i]['forge_points'] > 0)
					{
                        h.push('<td class="text-center">' + Rankings[i]['forge_points'] + '</td>' +
							'<td class="text-center"><strong class="info">0</strong></td>' +
							'<td></td>'
						);
					}

					else {
						h.push('<td class="text-center">-</td><td class="text-center">-</td><td>&nbsp;</td>');
					}

					h.push('</tr>');
				}

				// Platz der FP zurückgibt
				else {
                    let // Gesamt LG FP
                        TotalFP = parseInt(UpdateEntity['state']['forge_points_for_level_up']),

						// eingezahlte FP auf dem Rang
                        EingezahltAufRang = (isNaN(parseInt(Rankings[i]['forge_points']))) ? 0 : parseInt(Rankings[i]['forge_points']),
						
                        // gesamt investierte FPs
                        GesamtInvesFP = (isNaN(parseInt(UpdateEntity['state']['invested_forge_points']))) ? 0 : parseInt(UpdateEntity['state']['invested_forge_points']) - EigenBetrag,

                        // restliche freie FP = gesamt LG FPs - bereits gesamt investierte
                        RestFreieFPAufRang = TotalFP - GesamtInvesFP,
						
						// 1/2 des möglichen HalberEinzahlbarerPlatzAufRanges = restliche freie FP - eingezahlte FP auf dem Rang
						HalberEinzahlbarerPlatzAufRang = Math.round(( RestFreieFPAufRang + EingezahltAufRang ) / 2);

					    // Sonderfall: Absichern des Rangs führt nur zum Gleichstand.
					    // In diesem Fall wird 1 FP mehr benötigt um den bestehenden Platz zu überholen
					    if(HalberEinzahlbarerPlatzAufRang === EingezahltAufRang) {
					    	HalberEinzahlbarerPlatzAufRang++;
					    }

					let EingezahltAufRang2 = 0;

                    for (let j = +i + 1; j < Rankings.length; j++) {
                        //Spieler selbst oder Spieler gelöscht => nächsten Rang überprüfen
                        if (Rankings[j]['rank'] !== undefined && Rankings[j]['rank'] !== -1) {
                            EingezahltAufRang2 = (isNaN(parseInt(Rankings[j]['forge_points']))) ? 0 : parseInt(Rankings[j]['forge_points']);
                            break;
                        }
                    }
                    
					let // diese FPs gibt es für diesen Rang zurück
                        NormalRangZurueck = parseInt(Rankings[i]['reward']['strategy_point_amount']),
						
						// Blaupausen
                        blp = Rankings[i]['reward']['blueprints'] !== undefined ? Math.round(parseInt(Rankings[i]['reward']['blueprints']) * arc) : 0,
						
                        med = Rankings[i]['reward']['resources']['medals'] !== undefined ? Math.round(parseInt(Rankings[i]['reward']['resources']['medals']) * arc) : 0,
						
						MaezenRangTotal = Math.round(NormalRangZurueck * arc),

						zuViel = false;


					let trClass = '';

					/*
					console.log('Platz: ' + i);
					console.log('GesamtInvesFP: ', GesamtInvesFP);
					console.log('HalberEinzahlbarerPlatzAufRang: ', HalberEinzahlbarerPlatzAufRang);
					console.log('TotalFP: ', TotalFP);
					console.log('(GesamtInvesFP + HalberEinzahlbarerPlatzAufRang) === TotalFP: ', (GesamtInvesFP + HalberEinzahlbarerPlatzAufRang) === TotalFP);
					console.log('---------------------------');
					*/

					if(isSelf) {
						trClass = ' class="info-row"';
                    }

                    // Schon Einzahlung in höheren Rang vorhanden
                    else if ((EigenPos !== undefined && i > EigenPos)) {
                        trClass = ' class="text-grey"';
                    }

					// bereits eingezahlt + Mäzen geht genau bis gesamt FP
					else if( ( (RestFreieFPAufRang - EingezahltAufRang) > (MaezenRangTotal - HalberEinzahlbarerPlatzAufRang) && (MaezenRangTotal - HalberEinzahlbarerPlatzAufRang > 0)) || ((RestFreieFPAufRang / 2) === MaezenRangTotal)) {
						trClass = ' class="bg-green"';
					}

					// ist mehr offen als Mäzenrang, nicht save
					else if(TotalFP > (MaezenRangTotal + GesamtInvesFP) && EingezahltAufRang < MaezenRangTotal) {
						trClass = ' class="bg-red"';
					}

					// ist mehr offen als Mäzenrang, nicht save
					else if((HalberEinzahlbarerPlatzAufRang < MaezenRangTotal) && (GesamtInvesFP + HalberEinzahlbarerPlatzAufRang) === TotalFP) {
						trClass = ' class="bg-yellow"';
					}

					// kann nicht mehr eingezahlt werden, zu viel || ist schon mit (1,9) belegt oder überzahlt
					else if((GesamtInvesFP + HalberEinzahlbarerPlatzAufRang) > TotalFP || EingezahltAufRang >= MaezenRangTotal) {
						trClass = ' class="text-grey"';
						zuViel = true;
					}
                    
					// erste drei Spalten
                    h.push('<tr' + trClass + '><td><strong>' + Rankings[i]['rank'] + '</strong></td>' +
						'<td class="text-center">' +
							'<strong class="' + (MaezenRangTotal > Calculator.AvailableFP ? 'error' : 'success') + '">' +
								HTML.Format(MaezenRangTotal) +
							'</strong>' +
						'</td>' +
						'<td class="text-center' + (MaezenRangTotal > Calculator.AvailableFP ? ' error' : '') + '">' + HTML.Format(blp) + '</td>' +
						'<td class="text-center' + (MaezenRangTotal > Calculator.AvailableFP ? ' error' : '') + '">' + HTML.Format(med) + '</td>');


					// letzte beiden Spalten
					// Spieler selbst
					if(isSelf)
					{
						let ZielEinzahlung = Math.round((RestFreieFPAufRang + EingezahltAufRang2) / 2);
						let Kurs = Math.round(EingezahltAufRang * 100 / NormalRangZurueck);

						if (EingezahltAufRang === MaezenRangTotal)
						{
							h.push(
								'<td class="text-center">' + HTML.Format(EingezahltAufRang) + '/' + HTML.Format(Math.ceil(ZielEinzahlung)) + '</td>' +
								'<td class="text-center"><strong>0</strong></td>' +
								'<td class="text-center"><strong>' + HTML.Format(Kurs) + '%</strong></td>'
							);
						}
						else if (EingezahltAufRang > 0)
						{
							h.push('<td class="text-center">' + HTML.Format(EingezahltAufRang) + '/' + HTML.Format(Math.ceil(ZielEinzahlung)) + '</td>');

							let w = (MaezenRangTotal - EingezahltAufRang);
							h.push('<td class="text-center"><strong>' + (w === 0 ? '0' : HTML.Format(w)) + '</strong></td>');
							h.push('<td class="text-center"><strong>' + HTML.Format(Kurs) + '%</strong></td>');
						}
						else
						{
							h.push('<td class="text-center">-</td>');
							h.push('<td class="text-center">-</td>');
							h.push('<td class="text-center">' + HTML.Format(Kurs) + '%</td>');
						}
					}

					// andere Spieler oder leer
					else {

						let Kurs = Math.round((HalberEinzahlbarerPlatzAufRang * 100 / NormalRangZurueck));

						// geht genau auf
						if(MaezenRangTotal - HalberEinzahlbarerPlatzAufRang === 1){
							h.push('<td class="text-center" data-case="1">' + HTML.Format(HalberEinzahlbarerPlatzAufRang) + '</td><td class="text-center"><strong class="success">1</strong></td>');

							h.push('<td class="text-center">' + HTML.Format(Kurs) + '%</td>');
							if (zuViel === false) {
								BestKurs = Math.min(BestKurs, Kurs);
							}
						}

						else if(EingezahltAufRang >= MaezenRangTotal || (MaezenRangTotal - HalberEinzahlbarerPlatzAufRang) < 1) {

							let v = '-';

							// negativ auch ausgeben?
							if(Settings.GetSetting('CalculatorShowNegativ')){
								let w = (MaezenRangTotal - HalberEinzahlbarerPlatzAufRang);
								v = '<strong class="' + (w > 0 ? 'success' : 'error') + '">' + HTML.Format(w) + '</strong>';
							}

							h.push('<td class="text-center">-</td><td class="text-center">' + v + '</td><td>&nbsp;</td>');

							if(zuViel === false) {
								BestKurs = Math.min(BestKurs, Kurs);
							}
						}

						else if(HalberEinzahlbarerPlatzAufRang > 0 && zuViel === false) {
							h.push('<td class="text-center" data-case="2">' + HTML.Format(HalberEinzahlbarerPlatzAufRang) + '</td>');

							let w = (MaezenRangTotal - HalberEinzahlbarerPlatzAufRang);

							// würde leveln
							if((GesamtInvesFP + HalberEinzahlbarerPlatzAufRang) === TotalFP)
							{
								h.push('<td class="text-center" data-case="3"><abbr><strong class="warning" title="ACHTUNG! Levelt das LG!">' + ( w === 0 ? '0' : HTML.Format(w)) + '</strong></abbr></td>');

								h.push('<td class="text-center"><strong>' + HTML.Format(Kurs) + '%</strong></td>');

								BestKurs = Math.min(BestKurs, Kurs);

								if (w >= 0)
								{
									h.push( Calculator.PlaySound() );
								}
							}
							else {
								h.push('<td class="text-center" data-case="4"><strong class="success">' + ( w === 0 ? '0' : HTML.Format(w)) + '</strong></td>');

								h.push('<td class="text-center">' + HTML.Format(Kurs) + '%</td>');
								BestKurs = Math.min(BestKurs, Kurs);

								if (w >= 0)
								{
									h.push( Calculator.PlaySound() );
								}
							}
						}

						// letzte beiden leer
						else {
							h.push('<td class="text-center" data-case="5">-</td>');
							h.push('<td class="text-center">-</td><td>&nbsp;</td>');
						}
					}

					h.push('</tr>');
				}

				// nach dem Platz 5 raus...
                if (Rankings[i]['rank'] === 5)
				{
					break;
				}
			}
		}

		$('#costTable').html(h.join(''));

        let StorageKey = UpdateEntity['player_id'] + '/' + UpdateEntity['cityentity_id'];

		// Level/FP/BestKurs/UNIX-Time
        let StorageValue = UpdateEntity['level'] + '/' + UpdateEntity['state']['invested_forge_points'] + '/' + BestKurs + '/' + new Date().getTime();
		localStorage.setItem(StorageKey, StorageValue);
	},

	/**
	 * Übersicht der LGs scannen
	 *
	 * @param div
	 * @param arc
	 * @param d
	 * @constructor
	 */
    ParseOverview: (arc, d, DisableAudio)=> {

		// nix drin, raus
		if (d.length === 0)
		{
			return;
		}

		// Wenn die Box noch nicht da ist, neu erzeugen und in den DOM packen
		if( $('#LGOverviewBox').length === 0 )
        {
            let spk = localStorage.getItem('CalculatorOverviewTone');

            if (spk === null) {
                localStorage.setItem('CalculatorOverviewTone', 'deactivated');
                Calculator.PlayOverviewInfoSound = false;

            } else {
                Calculator.PlayOverviewInfoSound = (spk !== 'deactivated');
            }

			let args = {
				'id': 'LGOverviewBox',
				'title': i18n['Boxes']['LGOverviewBox']['Title'],
				'auto_close': true,
                'dragdrop': true,
                'speaker': 'CalculatorOverviewTone'
			};

			HTML.Box(args);
		}


		let GBs = d,
			h = [],
			PlayerName = GBs['0']['player']['name'];

		h.push('<div class="text-center dark-bg" style="padding:5px 0 3px;">');

		h.push('<p class="head-bar">' +
				'<strong>' + PlayerName + ' </strong>' +
				'<span class="color-description">?' +
					'<span>' +
						'<span style="color:#FFB539">' + i18n['Boxes']['LGOverviewBox']['Tooltip']['FoundNew'] + '</span>' +
						'<span style="color:#29b206">' + i18n['Boxes']['LGOverviewBox']['Tooltip']['FoundAgain'] + '</span>' +
						'<span style="color:#FF6000">' + i18n['Boxes']['LGOverviewBox']['Tooltip']['NoPayment'] + '</span>' +
					'</span>' +
				'</span>' +
			'</p>');

		h.push('</div>');
		h.push('<table id="OverviewTable" class="foe-table">');

		h.push('<thead>' +
			'<tr>' +
				'<th>' + i18n['Boxes']['LGOverviewBox']['Building'] + '</th>' +
				'<th class="text-center">' + i18n['Boxes']['LGOverviewBox']['Level'] + '</th>' +
				'<th class="text-center">' + i18n['Boxes']['LGOverviewBox']['PayedTotal'] + '</th>' +
				'<th class="text-center">' + i18n['Boxes']['LGOverviewBox']['Rate'] + '</th>' +
			'</tr>' +
		'</thead>');

		let PlayAudio = false,
			LGFound = false;

		// alle LGs der Übersicht durchsteppen
		for (let i in GBs)
		{
			if(GBs.hasOwnProperty(i))
			{
				let PlayerID = GBs[i]['player']['player_id'],
					EntityID = GBs[i]['city_entity_id'],
					GBName = GBs[i]['name'],
					GBLevel = GBs[i]['level'],
					CurrentProgress = GBs[i]['current_progress'],
					MaxProgress = GBs[i]['max_progress'],
					Rank = GBs[i]['rank'];

				let BestKurs = 0,
					StorageKey = PlayerID + "/" + EntityID,
					StorageValue = localStorage.getItem(StorageKey),
					StrongClass;

				if (StorageValue !== null)
				{
					let StorageKeyParts = StorageValue.split('/');
					let Level = parseInt(StorageKeyParts[0]);
					let FP = parseInt(StorageKeyParts[1]);

					if (Level === GBLevel && FP === CurrentProgress)
					{
						BestKurs = StorageKeyParts[2];
					}
				}

				let UnderScorePos = EntityID.indexOf('_');
				let AgeString = EntityID.substring(UnderScorePos + 1);

				UnderScorePos = AgeString.indexOf('_');
				AgeString = AgeString.substring(0, UnderScorePos);

				if (CurrentProgress === undefined)
				{
					CurrentProgress = 0;
				}

				let P1 = Calculator.GetP1(AgeString, GBLevel);

				if (Rank === undefined && P1 * arc >= (MaxProgress - CurrentProgress) / 2)
				{
					if (BestKurs < arc * 100)
					{
						LGFound = true;
						let Kurs = '';

						if (CurrentProgress === 0)
						{
							StrongClass = ' class="warning"'; // Möglicherweise nicht freigeschaltet
							Kurs = Math.round(MaxProgress * 100 / P1 / 2) + '%'
						}
						else if (BestKurs === 0)
						{
							StrongClass = '';
							PlayAudio = true;
							Kurs = '???%';
						}
						else
						{
							StrongClass = ' class="success"';
							PlayAudio = true;
							Kurs = BestKurs + '%';
						}

						h.push('<tr>');
						h.push('<td><strong' + StrongClass + '>' + GBName + '</strong></td>');
						h.push('<td class="text-center"><strong' + StrongClass + '>' + GBLevel + '</strong></td>');
						h.push('<td class="text-center"><strong' + StrongClass + '>' + HTML.Format(CurrentProgress) + ' / ' + HTML.Format(MaxProgress) + '</strong></td>');
						h.push('<td class="text-center"><strong' + StrongClass + '>' + Kurs + '</strong></td>');
						h.push('</tr>');
					}
				}
			}
		}

		h.push('</table>');

		// Gibt was zu holen
		if (LGFound)
		{
            if (PlayAudio && !DisableAudio)
			{
				Calculator.PlayOverviewSound();
			}
		}

		// gibt nichts zu holen
		else {
			h = [];

			h.push('<div class="text-center yellow-strong nothing-to-get">' + HTML.i18nReplacer(
				i18n['Boxes']['LGOverviewBox']['NothingToGet'],
				{
					'player' : PlayerName
				}
			) + '</div>');
		}

        $('#LGOverviewBox').find('#LGOverviewBoxBody').html(h.join(''));


        $('body').on('click', '#CalculatorOverviewTone', function () {

            let disabled = $(this).hasClass('deactivated');

            localStorage.setItem('CalculatorOverviewTone', (disabled ? '' : 'deactivated'));
            Calculator.PlayOverviewInfoSound = !!disabled;

            if (disabled === true) {
                $('#CalculatorOverviewTone').removeClass('deactivated');
            } else {
                $('#CalculatorOverviewTone').addClass('deactivated');
            }
        });
	},


	/**
	 * Spielt einen Sound im Calculator ab
	 *
	 * @returns {string}
	 * @constructor
	 */
    PlaySound: () => {
        if (Calculator.PlayInfoSound) {
            Calculator.SoundFile.play();
        }
    },


    /**
    * Spielt einen Sound in der Overview ab
    *
    * @returns {string}
    * @constructor
    */
    PlayOverviewSound: () => {
        if (Calculator.PlayOverviewInfoSound) {
            Calculator.SoundFile.play();
        }
    },


	/**
	 * P1 aller Zeitalter
	 *
	 * @param AgeString
	 * @param Level
	 * @returns {number}
	 * @constructor
	 */
	GetP1: (AgeString, Level)=>{
		let BronzeAge = [5, 10, 10, 15, 25, 30, 35, 40, 45, 55, 60, 65, 75, 80, 85, 95, 100, 110, 115, 125, 130, 140, 145, 155, 160, 170, 180, 185, 195, 200, 210, 220, 225, 235, 245, 250, 260, 270, 275, 285, 295, 300, 310, 320, 330, 340, 345, 355, 365, 375, 380, 390, 400, 410, 420, 430, 440, 445, 455, 465, 475, 485, 495, 505, 510, 520, 530, 540, 550, 560, 570, 580, 590, 600, 610, 620, 630, 640, 650, 660, 670, 680, 690, 700, 710, 720, 730, 740, 750, 760, 770, 780, 790, 800, 810, 820, 830, 840, 850, 860, 870, 880, 890, 905, 915, 925, 935, 945, 955, 965, 975, 985, 995, 1010, 1020, 1030, 1040, 1050, 1060, 1070, 1085, 1095, 1105, 1115, 1125, 1135, 1150, 1160, 1170, 1180, 1190, 1200, 1215, 1225, 1235, 1245, 1255, 1270, 1280, 1290, 1300, 1310, 1325, 1335, 1345, 1355, 1370, 1380, 1390, 1400, 1415, 1425, 1435, 1445, 1460, 1470, 1480];
		
		let IronAge = [5, 10, 15, 20, 25, 30, 40, 45, 50, 60, 65, 70, 80, 85, 95, 105, 110, 120, 125, 135, 145, 150, 160, 170, 175, 185, 195, 200, 210, 220, 230, 240, 245, 255, 265, 275, 285, 290, 300, 310, 320, 330, 340, 350, 360, 370, 380, 390, 400, 405, 415, 425, 435, 450, 455, 465, 475, 485, 495, 510, 520, 530, 540, 550, 560, 570, 580, 590, 600, 610, 620, 630, 645, 655, 665, 675, 685, 695, 705, 720, 730, 740, 750, 760, 775, 785, 795, 805, 815, 825, 840, 850, 860, 870, 885, 895, 905, 915, 930, 940, 950, 960, 975, 985, 995, 1010, 1020, 1030, 1040, 1055, 1065];
		
		let EarlyMiddleAge = [5, 10, 15, 20, 25, 35, 40, 50, 55, 65, 70, 80, 85, 95, 100, 110, 120, 130, 135, 145, 155, 165, 175, 180, 190, 200, 210, 220, 230, 240, 250, 255, 265, 275, 285, 295, 305, 315, 325, 335, 345, 360, 370, 380, 390, 400, 410, 420, 430, 440, 450, 465, 475, 485, 495, 505, 515, 525, 540, 550, 560, 570, 585, 595, 605, 615, 625, 640, 650, 660, 675, 685, 695, 705, 720, 730, 740, 755, 765, 775, 790, 800, 810, 825, 835, 850, 860, 875, 885, 895, 910, 920, 930, 945, 955, 970, 980, 995, 1005, 1015, 1030, 1040, 1055, 1065, 1080, 1090, 1105, 1115, 1130, 1140, 1155, 1165, 1180, 1190, 1205, 1215, 1230, 1240, 1255, 1265, 1280, 1290, 1305, 1320, 1330, 1345, 1355, 1370, 1380, 1395, 1405, 1420, 1435];
		
		let HighMiddleAge = [5, 10, 15, 20, 30, 35, 45, 50, 60, 65, 75, 85, 95, 100, 110, 120, 130, 140, 150, 155, 165, 175, 185, 195, 205, 215, 225, 235, 245, 255, 265, 275, 285, 300, 310, 320, 330, 340, 350, 365, 375, 385, 395, 405, 420, 430, 440, 450, 465, 475, 485, 500, 510, 520, 535, 545, 555, 570, 580, 590, 605, 615, 630, 640, 650, 665, 675, 690, 700, 715, 725, 735, 750, 760, 775, 785, 800, 810, 825, 835, 850, 860, 875, 890, 900, 915, 925, 940, 950, 965, 975, 990, 1005, 1015, 1030, 1040, 1055, 1070, 1080, 1095, 1110, 1120, 1135, 1150, 1160, 1175, 1190, 1200, 1215, 1230, 1240, 1255];
		
		let LateMiddleAge = [5, 10, 15, 25, 30, 40, 45, 55, 65, 70, 80, 90, 100, 110, 120, 125, 140, 150, 155, 170, 180, 190, 200, 210, 220, 230, 240, 250, 265, 275, 285, 295, 310, 320, 330, 340, 355, 365, 375, 390, 400, 410, 425, 435, 450, 460, 470, 485, 495, 510, 520, 535, 545, 560, 570, 585, 595, 610, 620, 635, 645, 660, 670, 685, 700, 710, 725, 735, 750, 765, 775, 790, 805, 815, 830, 845, 855, 870, 885, 895, 910, 925, 935, 950, 965, 980, 990, 1005, 1020, 1035, 1045, 1060, 1075, 1090, 1105, 1115, 1130, 1145, 1160, 1175, 1185, 1200, 1215, 1230, 1245, 1260, 1275, 1285, 1300, 1315, 1330, 1345, 1360, 1375, 1390, 1405, 1415, 1430, 1445, 1460, 1475, 1490, 1505, 1520, 1535, 1550, 1565, 1580, 1595, 1610, 1625, 1640, 1655, 1670, 1685, 1700, 1715, 1730, 1745, 1760, 1775, 1790];
		
		let ColonialAge = [5, 10, 15, 25, 35, 40, 50, 60, 65, 75, 85, 95, 105, 115, 125, 135, 145, 155, 170, 180, 190, 200, 210, 225, 235, 245, 260, 270, 280, 295, 305, 315, 330, 340, 350, 365, 375, 390, 400, 415, 425, 440, 450, 465, 480, 490, 505, 515, 530, 540, 555, 570, 580, 595, 610, 620, 635, 650, 665, 675, 690, 705, 715, 730, 745, 760, 775, 785, 800, 815, 830, 840, 855, 870, 885, 900, 915, 930, 940, 955, 970, 985, 1000, 1015, 1030, 1045, 1060, 1075, 1090, 1100, 1115, 1130, 1145, 1160, 1175, 1190, 1205, 1220, 1235, 1250, 1265, 1280, 1295, 1310, 1325];
		
		let IndustrialAge = [10, 10, 20, 25, 35, 45, 50, 60, 70, 80, 90, 100, 115, 120, 135, 145, 155, 165, 180, 190, 200, 215, 225, 235, 250, 260, 275, 285, 300, 310, 325, 335, 350, 360, 375, 390, 400, 415, 425, 440, 455, 465, 480, 495, 505, 520, 535, 550, 560, 575, 590, 605, 620, 635, 645, 660, 675, 690, 705, 720, 735, 745, 760, 775, 790, 805, 820, 835, 850, 865, 880, 895, 910, 925, 940, 955, 970, 985, 1000, 1015, 1030, 1045, 1065, 1075, 1095, 1110, 1125, 1140, 1155, 1170, 1185, 1200, 1220, 1235, 1250, 1265, 1280, 1300, 1315, 1330, 1345, 1360, 1375, 1395, 1410, 1425];
		
		let ProgressiveEra = [10, 10, 20, 30, 35, 45, 55, 65, 75, 85, 95, 105, 120, 130, 140, 155, 165, 175, 190, 200, 215, 225, 240, 250, 265, 275, 290, 300, 315, 330, 340, 355, 370, 385, 395, 410, 425, 440, 450, 465, 480, 495, 510, 525, 535, 550, 565, 580, 595, 610, 625, 640, 655, 670, 685, 700, 715, 730, 745, 760, 775, 790, 805, 820, 835, 855, 870, 885, 900, 915, 930, 945, 965, 980, 995, 1010, 1025, 1045, 1060, 1075, 1090, 1110, 1125, 1140, 1160, 1175, 1190, 1205, 1225, 1240, 1255, 1275, 1290, 1305, 1325, 1340, 1355, 1375, 1390, 1410, 1425, 1440, 1460, 1475, 1490, 1510, 1525, 1545, 1560, 1580, 1595, 1615, 1630, 1650, 1665, 1685, 1700, 1715, 1735, 1755, 1770, 1790, 1805, 1825, 1840, 1860, 1875, 1895, 1915, 1930, 1950, 1965, 1985, 2000, 2020, 2040, 2055, 2075, 2095, 2110, 2130, 2145, 2165, 2185, 2200, 2220, 2240, 2255, 2275, 2295, 2310, 2330, 2350, 2365, 2385, 2405, 2420, 2440, 2460, 2480, 2495, 2515, 2535, 2555, 2570, 2590, 2610, 2630, 2645, 2665, 2685, 2705, 2720];
		
		let ModernEra = [10, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 115, 125, 135, 150, 160, 175, 185, 200, 210, 225, 240, 250, 265, 280, 290, 305, 320, 335, 345, 360, 375, 390, 405, 420, 430, 450, 460, 475, 490, 505, 520, 535, 550, 565, 580, 600, 615, 630, 645, 660, 675, 690, 705, 725, 740, 755, 770, 785, 800, 820, 835, 850, 870, 885, 900, 915, 935, 950, 965, 985, 1000, 1015, 1035, 1050, 1065, 1085, 1100, 1120, 1135, 1150, 1170, 1185, 1205, 1220, 1240, 1255, 1275, 1290, 1310, 1325, 1345, 1360, 1380, 1395, 1415, 1430, 1450, 1470, 1485, 1505];
		
		let PostModernEra = [10, 10, 20, 30, 40, 50, 60, 75, 85, 95, 110, 120, 130, 145, 155, 170, 185, 195, 210, 225, 235, 250, 265, 280, 295, 305, 320, 335, 350, 365, 380, 395, 410, 425, 440, 455, 470, 485, 500, 515, 535, 550, 565, 580, 595, 615, 630, 645, 660, 675, 695, 710, 725, 745, 760, 775, 795, 810, 830, 845, 860, 880, 895, 915, 930, 945, 965, 985, 1000, 1020, 1035, 1050, 1070, 1090, 1105, 1125, 1140, 1160, 1175, 1195, 1215, 1230, 1250, 1265, 1285, 1305, 1320, 1340, 1360, 1375, 1395, 1415, 1435, 1450, 1470, 1490, 1510, 1525, 1545, 1565, 1585, 1600, 1620, 1640, 1660, 1680, 1695, 1715, 1735, 1755, 1775, 1790, 1810, 1830, 1850, 1870, 1890, 1910, 1930, 1950, 1965, 1985, 2005, 2025, 2045, 2065, 2085, 2105, 2125, 2145, 2165, 2185, 2205, 2225, 2245, 2265];
		
		let ContemporaryEra = [10, 15, 20, 30, 40, 55, 65, 75, 85, 100, 115, 125, 140, 150, 165, 180, 190, 205, 220, 235, 250, 265, 280, 290, 305, 320, 335, 355, 365, 385, 400, 415, 430, 445, 460, 480, 495, 510, 525, 545, 560, 575, 590, 610, 625, 645, 660, 675, 695, 710, 730, 745, 765, 780, 800, 815, 835, 850, 870, 885, 905, 920, 940, 960, 975, 995, 1015, 1030, 1050, 1070, 1085, 1105, 1125, 1140, 1160, 1180, 1200, 1215, 1235, 1255, 1275, 1290, 1310, 1330, 1350, 1370, 1390, 1410, 1425, 1445, 1465, 1485, 1505, 1525, 1545, 1565, 1580, 1600, 1625, 1640, 1660, 1680, 1700, 1720, 1740, 1760, 1780, 1800, 1820, 1840, 1860, 1880, 1900, 1920, 1945, 1965, 1985, 2005, 2025, 2045, 2065, 2085, 2105, 2125];
		
		let TomorrowEra = [10, 15, 20, 35, 45, 55, 65, 80, 90, 105, 120, 130, 145, 160, 175, 185, 200, 215, 230, 245, 260, 275, 290, 305, 320, 335, 355, 370, 385, 400, 420, 435, 450, 465, 485, 500, 515, 535, 550, 570, 585, 605, 620, 640, 655, 675, 690, 710, 730, 745, 765, 780, 800, 820, 835, 855, 875, 890, 910, 930, 945, 965, 985, 1005, 1025, 1040, 1060, 1080, 1100, 1120, 1140, 1155, 1175, 1195, 1215, 1235, 1255, 1275, 1295, 1315, 1335, 1355, 1375, 1395, 1415, 1435, 1455, 1475, 1495, 1515, 1535, 1555, 1575, 1595, 1615, 1640, 1660, 1680, 1700, 1720, 1740, 1760, 1780, 1805];
		
		let FutureEra = [10, 15, 25, 35, 45, 60, 70, 85, 95, 110, 120, 135, 150, 165, 180, 195, 210, 225, 240, 255, 270, 290, 305, 320, 335, 355, 370, 385, 405, 420, 435, 455, 470, 490, 505, 525, 540, 560, 575, 595, 615, 630, 650, 670, 685, 705, 725, 740, 760, 780, 800, 815, 835, 855, 875, 895, 915, 930, 950, 970, 990, 1010, 1030, 1050, 1070, 1090, 1110, 1130, 1150, 1170, 1190, 1210, 1230, 1250, 1270, 1290, 1310, 1335, 1355, 1375, 1395, 1415, 1435, 1455, 1480, 1500, 1520, 1540, 1560, 1585, 1605, 1625, 1645, 1670, 1690, 1710, 1735, 1755, 1775, 1800, 1820, 1840, 1865, 1885, 1905, 1930, 1950, 1975, 1995, 2015, 2040, 2060, 2085, 2105, 2130, 2150, 2170, 2195, 2215, 2240, 2260, 2285, 2305, 2330, 2350, 2375, 2395, 2420, 2445, 2465, 2490, 2510, 2535, 2555, 2580, 2605, 2625, 2650, 2675, 2695, 2720, 2740, 2765, 2790, 2810, 2835, 2860, 2880, 2905, 2930, 2950, 2975, 3000, 3025, 3050, 3070, 3095, 3120, 3140, 3165, 3190, 3215, 3235, 3260, 3285, 3310, 3335, 3355, 3380, 3405, 3430, 3455, 3480, 3500, 3525, 3550, 3575, 3600, 3625, 3650, 3670, 3695, 3720];
		
		let ArcticFuture = [10, 15, 25, 35, 45, 60, 75, 85, 100, 115, 130, 145, 160, 170, 190, 205, 220, 235, 250, 265, 285, 300, 315, 335, 350, 370, 385, 400, 420, 440, 455, 475, 490, 510, 525, 545, 565, 585, 600, 620, 640, 660, 675, 695, 715, 735, 755, 775, 795, 815, 830, 850, 870, 895, 910, 930, 950, 970, 995, 1015, 1035, 1055, 1075, 1095, 1115, 1135, 1155, 1180, 1200, 1220, 1240, 1260, 1285, 1305, 1325, 1350, 1370, 1390, 1410, 1435, 1455, 1475, 1500, 1520, 1545, 1565, 1585, 1610, 1630, 1650, 1675, 1695, 1720, 1740, 1765, 1785, 1810, 1830, 1855, 1875, 1900, 1920, 1945, 1965, 1990, 2015, 2035, 2060, 2080, 2105, 2125, 2150, 2175, 2195, 2220, 2245, 2265, 2290, 2315, 2335, 2360, 2385, 2405, 2430, 2455, 2480, 2500, 2525, 2550, 2575, 2595, 2620, 2645, 2670, 2690, 2715, 2740];
		
		let OceanicFuture = [10, 15, 25, 35, 50, 65, 75, 90, 105, 120, 135, 150, 165, 180, 195, 210, 230, 245, 260, 280, 295, 310, 330, 350, 365, 385, 400, 420, 440, 455, 475, 495, 510, 530, 550, 570, 590, 605, 625, 645, 665, 685, 705, 725, 745, 765, 785, 805, 825, 845, 865, 890, 910, 930, 950, 970, 990, 1015, 1035, 1055, 1075, 1100, 1120, 1140, 1160, 1185, 1205, 1225, 1250, 1270, 1295, 1315, 1335, 1360, 1380, 1405, 1425, 1450, 1470, 1495, 1515, 1540, 1560, 1585, 1605, 1630, 1650, 1675, 1700, 1720, 1745, 1770, 1790, 1815, 1835, 1860, 1885, 1905, 1930, 1955, 1980, 2000, 2025, 2050, 2070, 2095, 2120, 2145, 2170, 2190, 2215, 2240, 2265, 2290, 2310];
		
		let VirtualFuture = [10, 15, 25, 40, 50, 65, 80, 95, 110, 125, 140, 155, 170, 185, 205, 220, 235, 255, 270, 290, 305, 325, 345, 360, 380, 400, 415, 435, 455, 475, 495, 510, 530, 550, 570, 590, 610, 630, 650, 670, 690, 715, 735, 755, 775, 795, 815, 840, 860, 880, 900, 925, 945, 965, 990, 1010, 1030, 1055, 1075, 1095, 1120, 1140, 1165, 1185, 1210, 1230, 1255, 1275, 1300, 1320, 1345, 1365, 1390, 1415, 1435, 1460, 1485, 1505, 1530, 1555, 1575, 1600, 1625, 1645, 1670, 1695, 1720, 1745, 1765, 1790, 1815, 1840, 1860, 1885, 1910, 1935, 1960, 1985, 2010, 2030, 2055, 2080, 2105, 2130, 2155, 2180, 2205, 2230, 2255, 2280, 2305, 2330, 2355, 2380, 2405, 2430, 2455, 2480, 2505, 2530];
		
		let SpaceAgeMars = [10, 15, 25, 40, 55, 70, 80, 95, 115, 125, 145, 160, 175, 195, 210, 230, 245, 265, 280, 300, 320, 335, 355, 375, 395, 415, 435, 455, 470, 490, 510, 535, 550, 575, 595, 615, 635, 655, 675, 700, 720, 740, 760, 785, 805, 825, 850, 870, 890, 915, 935, 960, 980, 1005, 1025, 1050, 1070, 1095, 1115, 1140, 1160, 1185, 1210, 1230, 1255, 1280, 1300, 1325, 1350, 1370, 1395, 1420, 1445, 1470, 1490, 1515, 1540, 1565, 1590, 1615, 1635, 1660, 1685, 1710, 1735, 1760, 1785, 1810, 1835, 1860, 1885, 1910, 1935, 1960, 1985, 2010, 2035, 2060, 2085, 2110, 2135, 2160];
		
		let AllAge = [5, 10, 15, 20, 30, 35, 45, 50, 60, 65, 75, 85, 95, 100, 110, 120, 130, 140, 150, 155, 165, 175, 185, 195, 205, 215, 225, 235, 245, 255, 265, 275, 285, 300, 310, 320, 330, 340, 350, 365, 375, 385, 395, 405, 420, 430, 440, 450, 465, 475, 485, 500, 510, 520, 535, 545, 555, 570, 580, 590, 605, 615, 630, 640, 650, 665, 675, 690, 700, 715, 725, 735, 750, 760, 775, 785, 800, 810, 825, 835, 850, 860, 875, 890, 900, 915, 925, 940, 950, 965, 975, 990, 1005, 1015, 1030, 1040, 1055, 1070, 1080, 1095, 1110, 1120, 1135, 1150, 1160, 1175, 1190, 1200, 1215, 1230, 1240, 1255];

		if (AgeString === 'BronzeAge')
		{
			if (BronzeAge.length < Level) return 0; else return BronzeAge[Level];
		}
		else if (AgeString === 'IronAge')
		{
			if (IronAge.length < Level) return 0; else return IronAge[Level];
		}
		else if (AgeString === 'EarlyMiddleAge')
		{
			if (EarlyMiddleAge.length < Level) return 0; else return EarlyMiddleAge[Level];
		}
		else if (AgeString === 'HighMiddleAge')
		{
			if (HighMiddleAge.length < Level) return 0; else return HighMiddleAge[Level];
		}
		else if (AgeString === 'LateMiddleAge')
		{
			if (LateMiddleAge.length < Level) return 0; else return LateMiddleAge[Level];
		}
		else if (AgeString === 'ColonialAge')
		{
			if (ColonialAge.length < Level) return 0; else return ColonialAge[Level];
		}
		else if (AgeString === 'IndustrialAge')
		{
			if (IndustrialAge.length < Level) return 0; else return IndustrialAge[Level];
		}
		else if (AgeString === 'ProgressiveEra')
		{
			if (ProgressiveEra.length < Level) return 0; else return ProgressiveEra[Level];
		}
		else if (AgeString === 'ModernEra')
		{
			if (ModernEra.length < Level) return 0; else return ModernEra[Level];
		}
		else if (AgeString === 'PostModernEra')
		{
			if (PostModernEra.length < Level) return 0; else return PostModernEra[Level];
		}
		else if (AgeString === 'ContemporaryEra')
		{
			if (ContemporaryEra.length < Level) return 0; else return ContemporaryEra[Level];
		}
		else if (AgeString === 'TomorrowEra')
		{
			if (TomorrowEra.length < Level) return 0; else return TomorrowEra[Level];
		}
		else if (AgeString === 'FutureEra')
		{
			if (FutureEra.length < Level) return 0; else return FutureEra[Level];
		}
		else if (AgeString === 'ArcticFuture')
		{
			if (ArcticFuture.length < Level) return 0; else return ArcticFuture[Level];
		}
		else if (AgeString === 'OceanicFuture')
		{
			if (BronzeAge.length < Level) return 0; else return OceanicFuture[Level];
		}
		else if (AgeString === 'VirtualFuture')
		{
			if (VirtualFuture.length < Level) return 0; else return VirtualFuture[Level];
		}
		else if (AgeString === 'SpaceAgeMars')
		{
			if (SpaceAgeMars.length < Level) return 0; else return SpaceAgeMars[Level];
		}
		else if (AgeString === 'AllAge')
		{
			if (AllAge.length < Level) return 0; else return AllAge[Level];
		}
		else
		{
			return 0;
		}
	}
};
