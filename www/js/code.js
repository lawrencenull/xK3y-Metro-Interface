var version='0.21';
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
				/*isodata = {
					"id" : id,
					"name" : iso
				}*/
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
		HTML+='<a href="javascript:scrollUp()"><div class="list-item game"><div class="list-item-icon accent" style="background-image:url(\'img/up.png\'); background-size: 72px;"></div><span class="list-item-text string-scrollup">'+Translate.strings["string-scrollup"]+'</span></div></a><br/>';
		//Native approach should be faster
		document.getElementById('listcontainer').innerHTML=HTML;
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

var Recent = {
	'makePage' : function () {
		if (!Recent.updated) {
			Recent.get();
			return;
		}
		var listName = 'Recently Added';
		var favLists = Fav.lists();
		var gameList = favLists[listName];
		var l = gameList.length;
		var HTML = '';
		var id, name, cover;
		for (var i=0; i<l; i++) {
			var name = gameList[i].name;
			var id = gameList[i].id;
			var cover = 'covers/'+id+'.jpg';
			HTML+='<a href="#details-page?'+id+'&'+escape(name)+'"><div class="list-item game '+id+'"><div class="list-item-icon accent" style="background-image:url(\''+cover+'\'); background-size: 72px;"></div><span class="list-item-text">'+name+'</span></div></a>';
		}
		document.getElementById('recentaddcontainer').innerHTML=HTML;
		//Trigger accentChange to make sure the list gets the correct colors
		accentChange(saveData['Settings'].accent);
	},
	'get' : function () {
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
		var l=ISOlist.length;
		var listName = 'Recently Added';
		var favLists = Fav.lists();
		if ($.isEmptyObject(favLists)) {
			favLists={};
		}
		var listExists = !$.isEmptyObject(favLists[listName]);
		var store, flag, name, id, favLists;
		for (var i=0;i<l;i++) {
			id = ISOlist[i].id;
			flag = false;
			store = saveData[id];
			if ($.isEmptyObject(store)) {
				flag = true;
				store = {};
			}
			else {
				if (!store.known) {
					flag = true
				}
			}
			if (flag) {
				store.known = true;
				if (listExists) {
					Recent.clear();
					listExists=false;
				}
				name = ISOlist[i].name;
				if ($.isEmptyObject(favLists)) {
					favLists={};
				}
				if (!(listName in favLists)) {
					Fav.createList(id, name, listName);
					favLists = Fav.lists();
				}
				else {
					Fav.addToList(id, name, listName);
				}
				saveData[id] = store;
			}
		}
		Settings.save();
		Recent.updated=true;
		Recent.makePage();
	},
	'clear' : function () {
		var favLists = Fav.lists();
		var listName = 'Recently Added';
		Fav.removeList(listName);
	},
	'updated' : false
}

function makeRecentlyAdded() {
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
	var iso, id, cover, flag, store;
	var HTML='';
	var l=ISOlist.length;
	for (var i=0;i<l;i++) {
		iso = ISOlist[i].name;
		id = ISOlist[i].id;
		cover = ISOlist[i].image;
		store = saveData[id];
		flag = false;
		if ($.isEmptyObject(store)) {
			flag = true;
		}
		else {
			if (!store.known) {
				flag = true
			}
		}
		//debug cover
		//cover = 'img/test.jpg';
		HTML+='<a href="#details-page?'+id+'&'+escape(iso)+'"><div class="list-item game '+id+'"><div class="list-item-icon accent" style="background-image:url(\''+cover+'\'); background-size: 72px;"></div><span class="list-item-text">'+iso+'</span></div></a>';
	}
	HTML+='<a href="javascript:scrollUp()"><div class="list-item game"><div class="list-item-icon accent" style="background-image:url(\'img/up.png\'); background-size: 72px;"></div><span class="list-item-text string-scrollup">'+Translate.strings["string-scrollup"]+'</span></div></a><br/>';
	//Native approach should be faster
	document.getElementById('listcontainer').innerHTML=HTML;
	//Trigger accentChange to make sure the list gets the correct colors
	accentChange(saveData['Settings'].accent);
	return;
}

function makeFolderStructurePage(args) {
	//If there are arguments and the page is created, we are requesting a folder
	if (args && foldersMade) {
		showPage(args[1]);
		return;
	}
	if (!foldersMade) {
		var dir, dirID, par, htmlPar, chk, id, name, cover, activeClass, HTML;
		var active=data.active;
		var ISOlist = data.ISOlist;
		var dirs = data.dirs;
		//Gathering object for all HTML
		var HTMLToAppend = {};
		//Create directories first
		var l = data.dirs.length;
		for (var i=0; i<l; i++) {
			//Current directory
			dir = escape(dirs[i].dir);
			//Parent of current dir
			par = dirs[i].par;
			//Check if parent is a HDD
			//chk = data.drives.toString().indexOf(par);
			//Each dir has own page, check for page
			if ($('div#'+dir+'-dir').length==0) {
				//Create a new page if one doesn't exist
				Pages.newPage(dir+'-dir', dir);
			}
			//If par is a HDD, make final par the container
			/*if (chk!=-1) {
				htmlPar = 'folderstructurecontainer';
			}
			//Otherwise prep final par
			else {
				htmlPar = par+"-dir";
				htmlPar = escape(htmlPar);
			}*/
			//If dir tile doesn't exist, create
			if (!document.getElementById(dir)) {
				//Create HTML for tile
				HTML='<a href="#folderstructure-page?'+dir+'-dir"><div class="tile accent" style="background-image:url(\'img/folder.png\'); background-size: 173px;"><span class="tile-title">'+unescape(dir)+'</span></div></a>';
				//Put HTML in gathering object
				if ($.isEmptyObject(HTMLToAppend[par])) {
					HTMLToAppend[par] = '';
				}
				HTMLToAppend[par] += HTML;
				//Append HTML to parent dir page
				//document.getElementById(htmlPar).innerHTML+=HTML;
			}
		}
		//Then the ISOs
		var l = ISOlist.length;
		for (var i=0; i<l; i++) {
			//Current game ID
			id = ISOlist[i].id;
			//Current game name
			name = ISOlist[i].name;
			//Current game parent dir
			par = ISOlist[i].par;
			//Current game coverart
			cover = ISOlist[i].image;
			//debug cover
			//cover = 'img/test.jpg';
			//Check if parent dir is HDD
			//chk = data.drives.toString().indexOf(par);
			//Same parent fix as with directories
			/*if (chk!=-1) {
				htmlPar = 'folderstructurecontainer';
			}
			//Otherwise prep final dir
			else {
				htmlPar = par+"-dir";
				htmlPar = escape(htmlPar);
			}*/
			activeClass='';
			//If game is active, highlight it
			if (id==active) {
				activeClass=' class="activeGame"';
			}
			//Prep game tile HTML
			HTML='<a href="#details-page?'+id+'&'+escape(name)+'"><div class="tile accent animate" style="background-image:url(\''+cover+'\'); background-size: 173px;"><span class="tile-title">'+name+'</span></div></a>';
			//Put HTML in gathering object
			if ($.isEmptyObject(HTMLToAppend[par])) {
				HTMLToAppend[par] = '';
			}
			HTMLToAppend[par] += HTML;
			//Append game tile to parent page
			//Performance issue with many games
			//document.getElementById(htmlPar).innerHTML+=HTML;
		};
		//Loop through all directories in gathering object
		for (var i in HTMLToAppend) {
			//dir = dirs[i].dir;
			//Get the HTML
			HTML = HTMLToAppend[i];
			//If dir is HDD, put into main container
			if (isHDD(i)) {
				htmlPar = 'folderstructurecontainer';
			}
			//Otherwise prep html parent ID
			else {
				htmlPar = escape(i + '-dir');
			}
			//Append all HTML at once to parent container
			document.getElementById(htmlPar).innerHTML+=HTML;
		}
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
		tileHTML+='<span class="tile-title string-nolists">'+Translate.strings["string-nolists"]+'</span>';
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
			$(document.getElementById(escape(listName)+'-list')).children('a').remove();
			document.getElementById(escape(listName)+'-list').innerHTML+=HTML;
			//Tile HTML
			tileHTML+='<a href="#favorites-page?'+escape(listName)+'-list">';
			tileHTML+='<div class="tile accent favlist '+color+'">';
			tileHTML+='<span class="tile-title">'+listName+'</span>';
			tileHTML+='</div></a>';
		}
	}
	tileHTML+='<a href="#favoritesmanagement-page?main">';
	tileHTML+='<div class="tile accent config '+color+'">';
	tileHTML+='<span class="tile-title title-favmanagement">'+Translate.strings["title-favmanagement"]+'</span>';
	tileHTML+='</div></a>';
	document.getElementById('favoritescontainer').innerHTML=tileHTML;
}

function makeFavManagementPage(args) {
	document.getElementById('favManagementExtra').innerHTML='';
	var tmp, id, name;
	if (args[1]!="main") {
		tmp=args[1].split('&',2);
		id = tmp[0];
		name = tmp[1];
	}
	var favLists = Fav.lists();
	if (!$.isEmptyObject(favLists) && args[1] != "main") {
		var HTML='';
		var favListNames = [];
		for (var i in favLists) {
			favListNames.push(i);
		}
		var first = true;
		var l = favListNames.length;
		for (var i=0;i<l;i++) {
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
			var preHTML=Translate.strings["string-addtolist"]+'<br/>';
			preHTML+='<a id="favAddDropdown" onclick="Dropdown.open(this);" class="dropdown">';
			HTML=preHTML+HTML;
			HTML+='</a>';
			HTML+='<div class="details-button-pane"><a href="javascript:Fav.addToList(\''+id+'\',\''+name+'\')" class="button widebutton">'+Translate.strings["string-done"]+'</a></div>';
			HTML+='<br/><br/>';
		}
		var removeLists = Fav.findList(id);
		if (removeLists.length!=0) {
			HTML+=Translate.strings["string-removefromlist"]+'<br/>';
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
			HTML+='<div class="details-button-pane"><a href="javascript:Fav.removeFromList(\''+id+'\', \''+name+'\')" class="button widebutton">'+Translate.strings["string-done"]+'</a></div>';
			HTML+='<br/><br/>';
		}
		document.getElementById('favManagementExtra').innerHTML=HTML;
	}
	if (!$.isEmptyObject(favLists) && args[1]=="main") {
		var listHTML='';
		var favListNames = [];
		for (var i in favLists) {
			favListNames.push(i);
		}
		var first = true;
		for (var i=0;i<favListNames.length;i++) {
			var extraclass=' invis';
			if(first) {
				extraclass=' dropdown-active'
			}
			listHTML+='<div id="'+escape(favListNames[i])+'" class="dropdown-item'+extraclass+'">';
			listHTML+='<span class="dropdownText">'+favListNames[i]+'</span>';
			listHTML+='</div>';
			first = false;
		}
		
		var preHTML=Translate.strings["string-removelist"]+'<br/>';
		preHTML+='<a id="listRemoveDropdown" onclick="Dropdown.open(this);" class="dropdown">';
		HTML=preHTML+listHTML;
		HTML+='</a>';
		HTML+='<div class="details-button-pane"><a href="javascript:Fav.removeList(undefined,true)" class="button widebutton">'+Translate.strings["string-done"]+'</a></div>';
		HTML+='<br/><br/>';
		
		//Mass game adding
		var preHTML=Translate.strings["string-massadd"]+'<br/>';
		preHTML+='<a id="massAddDropdown" onclick="Dropdown.open(this);" class="dropdown">';
		HTML+=preHTML+listHTML;
		HTML+='</a>';
		HTML+='<div class="details-button-pane"><a href="javascript:Fav.Mass.new()" class="button widebutton">'+Translate.strings["string-done"]+'</a></div>';
		HTML+='<br/><br/>';
		
		//Rename list
		var preHTML=Translate.strings["string-rename"]+'<br/>';
		preHTML+='<a id="listRename" onclick="Dropdown.open(this);" class="dropdown">';
		HTML+=preHTML+listHTML;
		HTML+='</a>';
		HTML+='New name:<br/><input id="favRenameInput" type="text" value="" class="searchinput"/><br/>';
		HTML+='<div class="details-button-pane"><a href="javascript:Fav.rename()" class="button widebutton">'+Translate.strings["string-done"]+'</a></div>';
		HTML+='<br/><br/>';
		
		//Append
		document.getElementById('favManagementExtra').innerHTML=HTML;
	}
	fixTextInput();
	var createButton = document.getElementById('favCreateButton');
	if (args[1] != 'main') {
		createButton.href = 'javascript:Fav.createList(\''+id+'\',\''+name+'\')';
	}
	else {
		createButton.href = 'javascript:Fav.createEmptyList()';
	}
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
	var pinButtonText = Translate.strings["string-pinmain"];
	//var favButtonAction = '';
	//var favButtonText = 'Add to favorites';
	var favLists = Fav.lists();
	if (!$.isEmptyObject(favLists)) {
		var pinned = favLists.Pinned;
		if (!$.isEmptyObject(pinned)) {
			var index = Fav.findIndex(pinned, id, true);
			if (index != -1) {
				pinButtonAction = 'Pin.remove(\''+id+'\', \''+name+'\');';
				pinButtonText = Translate.strings["string-removepin"];
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
			if ($(xml).find('title').text()==Translate.strings["string-notitle"]) {
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
			HTML+='<a class="button" href="javascript:launchGame(\''+id+'\');">'+Translate.strings["string-play"]+'</a>';
			HTML+='<a class="button" href="javascript:history.back();">'+Translate.strings["string-close"]+'</a>';
			HTML+='<a class="button" href="javascript:'+pinButtonAction+'">'+pinButtonText+'</a>';
			HTML+='<a class="button" href="#favoritesmanagement-page?'+id+'&'+name+'">'+Translate.strings["string-managefav"]+'</a>';
			HTML+='</div></div>';
			document.getElementById('details-page').innerHTML=HTML;
		},
		error: function() {
			title=unescape(name);
			var infoitems='';
			summary="&eacute; Betrayed by the ruling families of Italy, a young man embarks upon an epic quest for vengeance. To eradicate corruption and restore his family's honor, he will study the secrets of an ancient Codex, written by Altaïr. To his allies, he will become a force for change - fighting for freedom and justice. To his enemies, he will become a dark knight - dedicated to the destruction of the tyrants abusing the people of Italy. His name is Ezio Auditore da Firenze. He is an Assassin."
			HTML='<div class="spacer"></div><div class="spacer"></div><span class="page-title">'+title+'</span><br/><br/><div class="page-wrapper">';
			HTML+='<img class="details-cover" src="img/test.jpg"/>';
			HTML+='<span class="about-items">'+infoitems+'</span>'+summary+'<div class="details-button-pane">';
			HTML+='<a class="button" href="javascript:launchGame(\''+id+'\');">'+Translate.strings["string-play"]+'</a>';
			HTML+='<a class="button" href="javascript:history.back();">'+Translate.strings["string-close"]+'</a>';
			HTML+='<a class="button" href="javascript:'+pinButtonAction+'">'+pinButtonText+'</a>';
			HTML+='<a class="button" href="#favoritesmanagement-page?'+id+'&'+name+'">'+Translate.strings["string-managefav"]+'</a>';
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
				var title = Translate.strings["string-loadingtitle"];
				var message = Translate.string["string-opentray"];
				MessageBox.Show(title, message);
				$.get(url);
				updateActive(id);
			}
			else if (tray == 1 && guistate == 2) {
				var title = Translate.strings["string-loadingtitle"];
				var message = Translate.string["string-alreadyloaded"];
				var reload = Translate.string["string-reload"];
				MessageBox.Show(title, message, '<a class="button" href="javascript:MessageBox.Close();launchGame(\''+id+'\')">'+reload+'</a>');
			}
		}
	});
}