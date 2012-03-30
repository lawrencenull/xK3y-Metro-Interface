var version='0.01';
//Some global variables needed
var data;
var saveData;

//Main function, grabs all data from xk3y and parses it
function getData() {
	$.ajax({
		type: "GET",
		url: "data.xml",
		dataType: "xml",
		cache: false,
		success: function(xml) {
			var dirs = [];
			var ISOlist = [];
			var drives = [];
			var about = [];
			var cache = [];
			var iso;
			var id;
			var par;
			var dir;
			var coversrc;
			var isodata;
			var cacheImage;
			//Array of HDDs
			$(xml).find('MOUNT').each(function() {
				drives.push($(this).attr('NAME'));
			});
			//Parse ISO data
			$(xml).find('ISO').each(function() {
				iso = $(this).find('TITLE').text().replace(/\.iso/gi,"");
				id = $(this).find('ID').text();
				par = $(this.parentNode).attr('NAME');
				coversrc = "covers/"+id+".jpg";
				isodata = { 
						"id" : id, 
						"name" : iso, 
						"image" : coversrc, 
						"par" : par };
				ISOlist.push(isodata);
				//Cache images
				cacheImage = new Image();
				cacheImage.src = "covers/"+id+".jpg";
				cache.push(cacheImage);
			});
			//Directories
			$(xml).find('DIR').each(function() {
				dir = $(this).attr('NAME');
				par = $(this.parentNode).attr('NAME');
				dirs.push({"dir" : dir, "par" : par});
			});
			//About info
			$(xml).find('ABOUT').find('ITEM').each(function() {
				about.push({item: $(this).attr('NAME'), value: $(this).text()});
			});
			//Put everything into the data JSON object
			data = { 
				"dirs" : dirs, 
				"ISOlist" : ISOlist, 
				"drives" : drives, 
				"about" : about 
			};
			//Serverside storage
			$.ajax({
				type: "GET",
				url: "store.sh",
				dataType: "json",
				cache: false,
				success: function(response) {
					if (response == null || response == "") {
						//Nothing saved yet? Make a new empty object
						saveData={};
					}
					else {
						//Else use the saved stats
						saveData=response;
					}
					makeListPage();
					makeAbout();
					//Get the current page
					getCurrentPage();
					
					Settings.init();
				},
				error: function() {
					//Still make a new empty object, so we can still use it this session
					saveData={};

					makeListPage();
					makeAbout();
					//Get the current page
					getCurrentPage();
					
					Settings.init();
				}
			});
		}
	});
}

function makeListPage() {
	//Copy the ISOList! We don't want to mess up the other menus
	var ISOlist = data.ISOlist.slice();
	//Make it alpabetically listed
	ISOlist.sort(function(x,y) { 
		var a = String(x.name).toUpperCase(); 
		var b = String(y.name).toUpperCase(); 
		if (a > b) 
			return 1 
		if (a < b) 
			return -1 
		return 0; 
	});
	var iso;
	var id;
	var cover;
	var letter;
	var stored;
	var lastLetter='';
	var HTML='<div class="page-wrapper"><div class="spacer"></div><div class="spacer"></div><span class="page-title">list</span></div>';
	for (var i=0;i<=ISOlist.length-1;i++) {
		iso = ISOlist[i].name;
		id = ISOlist[i].id;
		cover = ISOlist[i].image;
		letter = iso.charAt(0).toLowerCase();

		if (HTML.indexOf('list-divider-'+letter)==-1) {
			if (lastLetter!='' && lastLetter != letter) {
				HTML+='</div>';
			}
			HTML+='<a href="#overlay?black" onclick="openLetterOverlay()"><div class="scrollcontainer"><div class="list-item header" id="list-divider-'+letter+'"><div class="list-divider accent-text accent-border">'+letter+'</div></div></a>';
			lastLetter=letter;
		}
		
		HTML+='<a href="#details-page?'+id+'&'+escape(iso)+'"><div class="list-item game" id="'+id+'"><div class="list-item-icon accent" style=""></div><span class="list-item-text">'+iso+'</span></div></a>';
	}
	HTML+='</div>';
	//Native approach should be faster
	document.getElementById('list-page').innerHTML=HTML;
}

function makeAbout() {
	var HTML='';
	for (var i=0; i<data.about.length; i++) {
		HTML += data.about[i].item+': '+data.about[i].value+'<br/>';
	}
	document.getElementById('xk3y-about').innerHTML=HTML;
	document.getElementById('version').innerHTML=version;
}

function prepDetails(id, name) {
	var url = 'covers/'+id+'.xml';
	$.ajax({
		type: "GET",
		url: url,
		dataType: "xml",
		cache: false,
		success: function(xml) {
			//Prepare title HTML
			var title;
			if ($(xml).find('title').text()=="No Title") title = unescape(name);
			else title = $(xml).find('title').text();
			var summary = $(xml).find('summary').text();
			var HTML='<div class="spacer"></div><div class="spacer"></div><span class="page-title">'+title+'</span><div class="page-wrapper"><br/><img class="details-cover" src="covers/'+id+'.jpg"/>'+summary+'<div class="details-button-pane"><a class="button" href="javascript:launchGame(\''+id+'\');" style="float:left">Play</a><a class="button" href="javascript:history.back();" style="float:right">Close</a></div></div>';
			document.getElementById('details-page').innerHTML=HTML;
		},
		error: function() {
			var summary="Betrayed by the ruling families of Italy, a young man embarks upon an epic quest for vengeance. To eradicate corruption and restore his family's honor, he will study the secrets of an ancient Codex, written by Alta�r. To his allies, he will become a force for change - fighting for freedom and justice. To his enemies, he will become a dark knight - dedicated to the destruction of the tyrants abusing the people of Italy. His name is Ezio Auditore da Firenze. He is an Assassin."
			var HTML='<div class="spacer"></div><div class="spacer"></div><span class="page-title">'+name+'</span><br/><div class="page-wrapper"><br/><img class="details-cover" src="img/test.jpg"/>'+summary+'<div class="details-button-pane"><a class="button" href="javascript:launchGame(\''+id+'\');" style="float:left">Play</a><a class="button" href="javascript:history.back();" style="float:right">Close</a></div></div>';
			document.getElementById('details-page').innerHTML=HTML;
		}
	});
	scrollUp();
}

function launchGame(id) {
	var url = "launchgame.sh?"+id;
	$.ajax({
		type: "GET",
		url: "data.xml",
		dataType: "xml",
		cache: false,
		success: function(xml) {
			var tray = $(xml).find('TRAYSTATE').text();
			var guistate = $(xml).find("GUISTATE").text();
			if (tray == 0) {
				$.get(url);
            }
			else if (tray == 1 && guistate == 1) {
				MessageBox.Show('Loading Notification', 'Please open your DVD tray.');
				$.get(url);
			}
			else if (tray == 1 && guistate == 2) {
				MessageBox.Show('Loading Notification', 'A game appears to be already loaded, please open your DVD tray and click "Reload"', '<a class="button" href="javascript:MessageBox.Close();launchGame(\''+id+'\')">Reload</a>');
			}
		}
	});
}