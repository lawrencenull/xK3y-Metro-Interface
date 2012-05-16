var version='0.08';
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
			var iso, id, par, dir, coversrc, isodata, cacheImage, active;
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
				//cacheImage = new Image();
				//cacheImage.src = "covers/"+id+".jpg";
				//cache.push(cacheImage);
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
			active=$(xml).find('ACTIVE').text();
			//Put everything into the data JSON object
			data = { 
				"dirs" : dirs, 
				"ISOlist" : ISOlist, 
				"drives" : drives, 
				"about" : about,
				"active" : active
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
					//Init settings
					Settings.init();
					//Get the current page
					getCurrentPage();
				},
				error: function() {
					//Still make a new empty object, so we can still use it this session
					saveData={};
					//Init settings
					Settings.init();
					//Get the current page
					getCurrentPage();
				}
			});
		}
	});
}

function makeCoverWallPage() {
	//If the page isn't created yet, create it now
	if (!wallMade) {
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
		var iso, id, cover;
		var HTML='<br/>';
		var l=ISOlist.length;
		var cur=0;
		for (var i=0;i<l;i++) {
			iso = ISOlist[i].name;
			id = ISOlist[i].id;
			cover = ISOlist[i].image;
			//debug cover
			//cover = 'img/test.jpg';
			HTML+='<a href="#details-page?'+id+'&'+escape(iso)+'"><div class="tile accent animate" style="background-image:url(\''+cover+'\'); background-size: 173px;"><span class="tile-title">'+iso+'</span></div></a>';
			cur++;
			/*if (cur == 2) {
				HTML+='<br/>';
				cur=0;
			}*/
		}
		document.getElementById('coverwallcontainer').innerHTML=HTML;
		//Trigger accentChange to make sure the tiles get the correct colors
		accentChange(saveData['Settings'].accent);
		wallMade=true;
		return;
	}
}

function makeListPage(args) {
	//If there are arguments and the page is created, we want to scroll to a letter
	if (args && listsMade) {
		scrollToLetter(args[1]);
		return;
	}
	else if (!listsMade) {
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
		var iso, id, cover, letter, activeClass;
		var lastLetter='';
		var active = data.active;
		var HTML='';
		var l=ISOlist.length;
		for (var i=0;i<l;i++) {
			iso = ISOlist[i].name;
			id = ISOlist[i].id;
			cover = ISOlist[i].image;
			//debug cover
			//cover = 'img/test.jpg';
			letter = iso.charAt(0).toLowerCase();
			if(isNumber(letter)) {
				letter='#';
			}
			if (HTML.indexOf('list-divider-'+letter)==-1) {
				if (lastLetter!='' && lastLetter != letter) {
					HTML+='</div>';
				}
				HTML+='<a href="#overlay?black" onclick="openLetterOverlay()"><div class="scrollcontainer"><div class="list-item header" id="list-divider-'+letter+'"><div class="list-divider accent-text accent-border">'+letter+'</div></div></a>';
				lastLetter=letter;
			}
			activeClass='';
			if (id==active) {
				activeClass=' accent-text';
			}
			HTML+='<a href="#details-page?'+id+'&'+escape(iso)+'"><div class="list-item game '+id+'"><div class="list-item-icon accent" style="background-image:url(\''+cover+'\'); background-size: 72px;"></div><span class="list-item-text'+activeClass+'">'+iso+'</span></div></a>';
		}
		HTML+='<a href="javascript:scrollUp()"><div class="list-item game"><div class="list-item-icon accent" style="background-image:url(\'img/up.png\'); background-size: 72px;"></div><span class="list-item-text">Scroll up</span></div></a><br/>';
		//Native approach should be faster
		document.getElementById('listcontainer').innerHTML=HTML;
		$(".easydate").easydate();
		listsMade=true;
		//Trigger accentChange to make sure the list gets the correct colors
		accentChange(saveData['Settings'].accent);
		//If we had arguments upon creation, scroll to the argument
		if (args) {
			scrollToLetter(args[1]);
		}
		return;
	}
}

function makeFolderStructurePage(args) {
	//If there are arguments and the page is created, we are requesting a folder
	if (args && foldersMade) {
		showPage(args[1]);
		return;
	}
	if (!foldersMade) {
		var dir, dirID, par, par1, chk, id, name, cover, activeClass, HTML;
		var active=data.active;
		//Create directories first
		var l = data.dirs.length;
		for (var i=0; i<l; i++) {
			dir = escape(data.dirs[i].dir);
			par = data.dirs[i].par;
			chk = data.drives.toString().indexOf(par);
			if ($('div#'+dir+'-dir').length==0) {
				//Create a new page
				Pages.newPage(dir+'-dir', dir);
			}
			if (chk!=-1) {
				par1 = 'folderstructurecontainer';
			}
			else {
				par1 = par+"-dir";
				par1 = escape(par1);
			}
			if (!document.getElementById(dir)) {
				HTML='<a href="#folderstructure-page?'+dir+'-dir"><div class="tile accent" style="background-image:url(\'img/folder.png\'); background-size: 173px;"><span class="tile-title">'+unescape(dir)+'</span></div></a>';
				document.getElementById(par1).innerHTML+=HTML;
			}
		}
		//Then the ISOs
		var l = data.ISOlist.length;
		for (var i=0; i<l; i++) {
			id = data.ISOlist[i].id;
			name = data.ISOlist[i].name;
			par = escape(data.ISOlist[i].par);
			cover = data.ISOlist[i].image;
			//debug cover
			//cover = 'img/test.jpg';
			chk = data.drives.toString().indexOf(par);
			//Same parent fix as with directories
			if (chk!=-1) {
				par1 = 'folderstructurecontainer';
			}
			else {
				par1 = par+"-dir";
			}
			activeClass='';
			//If game is active, highlight it
			if (id==active) {
				activeClass=' class="activeGame"';
			}
			HTML='<a href="#details-page?'+id+'&'+escape(name)+'"><div class="tile accent animate" style="background-image:url(\''+cover+'\'); background-size: 173px;"><span class="tile-title">'+name+'</span></div></a>';
			document.getElementById(par1).innerHTML+=HTML;
		};
		foldersMade=true;
		accentChange(saveData['Settings'].accent);
		//If we had arguments, it means a directory was requested upon creation; show the directory page
		if (args) {
			showPage(args[1]);
		}
		return;
	}
}

function makeFavoritesPage(args) {
	if (args) {
		showPage(args[1]);
		return;
	}
	var id, name, cover, activeClass, HTML, tileHTML, listName, gameList;
	var active=data.active;
	var color=saveData.Settings.accent;
	var favLists = Fav.lists();
	tileHTML='';
	if ($.isEmptyObject(favLists)) {
		tileHTML+='<a href="javascript:history.back()">';
		tileHTML+='<div class="tile accent favlist '+color+'">';
		tileHTML+='<span class="tile-title">No lists</span>';
		tileHTML+='</div></a>';
		document.getElementById('favoritescontainer').innerHTML=tileHTML;
	}
	else {
		var lists = [];
		for (var i in favLists) {
			lists.push(i);
		}
		var l = lists.length;
		tileHTML='';
		for (var i=0; i<l; i++) {
			listName=lists[i];
			var page = $(document.getElementById(escape(listName)+'-list'));
			//Create a new page
			if (page.length==0) {
				Pages.newPage(listName+'-list', listName);
			}
			gameList = favLists[listName];
			var k = gameList.length;
			HTML='';
			for (var j=0; j<k; j++) {
				id = gameList[j].id;
				name = gameList[j].name;
				cover = 'covers/'+id+'.jpg';
				href= '#details-page?'+id+'&'+escape(name);
				if (page.find('a[href="'+href+'"]').length!=0) {
					continue;
				}
				//debug cover
				//cover = 'img/test.jpg';
				HTML+='<a href="'+href+'"><div class="tile accent animate '+color+'" style="background-image:url(\''+cover+'\'); background-size: 173px;"><span class="tile-title">'+name+'</span></div></a>';
			}
			document.getElementById(escape(listName)+'-list').innerHTML+=HTML;
			//Tile HTML
			tileHTML+='<a href="#favorites-page?'+escape(listName)+'-list">';
			tileHTML+='<div class="tile accent favlist '+color+'">';
			tileHTML+='<span class="tile-title">'+listName+'</span>';
			tileHTML+='</div></a>';
		}
	}
	document.getElementById('favoritescontainer').innerHTML=tileHTML;
}

function makeFavManagementPage(args) {
	document.getElementById('favManagementExtra').innerHTML='';
	var tmp=args[1].split('&',2);
	var id = tmp[0];
	var name = tmp[1];
	var favLists = Fav.lists();
	if (!$.isEmptyObject(favLists)) {
		var HTML='';
		var favListNames = [];
		for (var i in favLists) {
			favListNames.push(i);
		}
		var first = true;
		for (var i=0;i<favListNames.length;i++) {
			var flag=false;
			var extraclass=' invis';
			//Find all lists this game is in
			var exists = Fav.findList(id);
			for (var j=0;j<exists.length;j++) {
				//Loop through all, continue if game is in current list
				if (favListNames[i]==exists[j]) {
					flag=true;
				}
			}
			if (flag) {
				continue;
			}
			if(first) {
				extraclass=' dropdown-active'
			}
			HTML+='<div id="'+escape(favListNames[i])+'" class="dropdown-item'+extraclass+'">';
			HTML+='<span class="dropdownText">'+favListNames[i]+'</span>';
			HTML+='</div>';
			first = false;
		}
		if (HTML.length!=0) {
			var preHTML='Select a list to add this game to:<br/>';
			preHTML+='<a id="favAddDropdown" onclick="Dropdown.open(this);" class="dropdown">';
			HTML=preHTML+HTML;
			HTML+='</a>';
			HTML+='<div class="details-button-pane"><a href="javascript:Fav.addToList(\''+id+'\',\''+name+'\')" class="button widebutton">done</a></div>';
			HTML+='<br/><br/>';
		}
		var removeLists = Fav.findList(id);
		if (removeLists.length!=0) {
			HTML+='Select a list to remove this game from:<br/>';
			HTML+='<a id="favRemoveDropdown" onclick="Dropdown.open(this);" class="dropdown">';
			for (var i=0;i<removeLists.length;i++) {
				var extraclass=' invis';
				if(i==0) {
					extraclass=' dropdown-active'
				}
				HTML+='<div id="'+escape(removeLists[i])+'" class="dropdown-item'+extraclass+'">';
				HTML+='<span class="dropdownText">'+removeLists[i]+'</span>';
				HTML+='</div>';
			}
			HTML+='</a>';
			HTML+='<div class="details-button-pane"><a href="javascript:Fav.removeFromList(\''+id+'\', \''+name+'\')" class="button widebutton">done</a></div>';
			HTML+='<br/><br/>';
		}
		document.getElementById('favManagementExtra').innerHTML=HTML;
	}
	fixTextInput();
	var createButton = document.getElementById('favCreateButton');
	createButton.href = 'javascript:Fav.createList(\''+id+'\',\''+name+'\')';
}

function makeSearchPage() {
	//Ugly fix for text input width
	fixTextInput();
}

function makeAboutPage() {
	var HTML='';
	for (var i=0; i<data.about.length; i++) {
		HTML += data.about[i].item+': '+data.about[i].value+'<br/>';
	}
	document.getElementById('xk3y-about').innerHTML=HTML;
	document.getElementById('version').innerHTML=version;
}

function makeOverlay(args) {
	if (args[1]=='grey') {
		$(args[0]).css('background-color','#181C18');
	}
	else if (args[1]=='black') {
		$(args[0]).css('background-color','');
	}
}

function prepDetails(id, name) {
	//If name arg is empty, we came from showPage, parse the id variable
	if (!name) {
		var tmp=id[1].split('&',2);
		id = tmp[0];
		name = tmp[1];
	}
	var url = 'covers/'+id+'.xml';
	document.getElementById('details-page').innerHTML='';
	var title, summary, HTML;
	var pinButtonAction = 'Pin.add(\''+id+'\', \''+name+'\');';
	var pinButtonText = 'Pin to main';
	//var favButtonAction = '';
	//var favButtonText = 'Add to favorites';
	var favLists = Fav.lists();
	if (!$.isEmptyObject(favLists)) {
		var pinned = favLists.Pinned;
		if (!$.isEmptyObject(pinned)) {
			var index = Fav.findIndex(pinned, id, true);
			if (index != -1) {
				pinButtonAction = 'Pin.remove(\''+id+'\', \''+name+'\');';
				pinButtonText = 'Remove from main';
			}
		}
		/*var favTest = Fav.findList(id);
		if (findList.length!=0) {
			
		}*/
	}
	$.ajax({
		type: "GET",
		url: url,
		dataType: "xml",
		cache: false,
		success: function(xml) {
			if ($(xml).find('title').text()=="No Title") {
				title = unescape(name);
			}
			else {
				title = $(xml).find('title').text();
			}
			summary = $(xml).find('summary').text();
			var infoitems='';
			$(xml).find('infoitem').each(function() {
				var string=$(this).text();
				//Add them all to a long HTML string
				if (string.indexOf('www')==0 || string.indexOf('http')==0) {
					string = '<a href="'+string+'" target="_blank">'+string+'</a>';
				}
				infoitems+=string+'<br/>';
			});
			infoitems+='<br/>';
			HTML='<div class="spacer"></div><div class="spacer"></div><span class="page-title">'+title+'</span><br/><br/><div class="page-wrapper">';
			HTML+='<img class="details-cover" src="covers/'+id+'.jpg"/>';
			HTML+='<span class="about-items">'+infoitems+'</span>'+summary+'<div class="details-button-pane">';
			HTML+='<a class="button" href="javascript:launchGame(\''+id+'\');">Play</a>';
			HTML+='<a class="button" href="javascript:history.back();">Close</a>';
			HTML+='<a class="button" href="javascript:'+pinButtonAction+'">'+pinButtonText+'</a>';
			HTML+='<a class="button" href="#favoritesmanagement-page?'+id+'&'+name+'">Manage favorites</a>';
			HTML+='</div></div>';
			document.getElementById('details-page').innerHTML=HTML;
		},
		error: function() {
			title=unescape(name);
			var infoitems='';
			summary="Betrayed by the ruling families of Italy, a young man embarks upon an epic quest for vengeance. To eradicate corruption and restore his family's honor, he will study the secrets of an ancient Codex, written by Altaïr. To his allies, he will become a force for change - fighting for freedom and justice. To his enemies, he will become a dark knight - dedicated to the destruction of the tyrants abusing the people of Italy. His name is Ezio Auditore da Firenze. He is an Assassin."
			HTML='<div class="spacer"></div><div class="spacer"></div><span class="page-title">'+title+'</span><br/><br/><div class="page-wrapper">';
			HTML+='<img class="details-cover" src="img/test.jpg"/>';
			HTML+='<span class="about-items">'+infoitems+'</span>'+summary+'<div class="details-button-pane">';
			HTML+='<a class="button" href="javascript:launchGame(\''+id+'\');">Play</a>';
			HTML+='<a class="button" href="javascript:history.back();">Close</a>';
			HTML+='<a class="button" href="javascript:'+pinButtonAction+'">'+pinButtonText+'</a>';
			HTML+='<a class="button" href="#favoritesmanagement-page?'+id+'&'+name+'">Manage favorites</a>';
			HTML+='</div></div>';
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
				updateActive(id);
            }
			else if (tray == 1 && guistate == 1) {
				MessageBox.Show('Loading Notification', 'Please open your DVD tray.');
				$.get(url);
				updateActive(id);
			}
			else if (tray == 1 && guistate == 2) {
				MessageBox.Show('Loading Notification', 'A game appears to be already loaded, please open your DVD tray and click "Reload"', '<a class="button" href="javascript:MessageBox.Close();launchGame(\''+id+'\')">Reload</a>');
			}
		}
	});
}