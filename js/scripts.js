$(document).ready(function() {
  var songs;
  var setlists;
  var songsPath = 'song-texts/';
  var songPathsArray = [];
  var setlistMode = false;
  var firstSetlistSongPath;
  var currentSetlistSongPath;
  var setlistArray;
  var currentSetlistSongnumber;
  var setlistTotalSongnumber;
  var nextSetlistSongnumber;
  var previousSetlistSongnumber;
  var nextSongButtonText;
  var navDirection;


  setSetlistMode();

  function setInitialVisibility() {
    $('#setlist-controls').hide();
    $('#setlist').hide();
    $('#menu').hide();
  };

  setInitialVisibility();


  // Function to load and parse CSV data
  function loadCSVFile(filePath, callback) {
    $.ajax({
      url: filePath,
      dataType: "text",
      success: function(data) {
        Papa.parse(data, {
          header: true,
          skipEmptyLines: true, // Exclude empty rows
          dynamicTyping: true,
          complete: function(results) {
            // Pad the 'Song ID' with zeros to ensure three digits
            results.data.forEach(function(song) {
              if (song['Song ID']) {
                song['Song ID'] = String(song['Song ID']).padStart(3, '0');
              }
            });

            results.data.forEach(function(setlist) {
              if (setlist['Setlist ID']) {
                setlist['Setlist ID'] = String(setlist['Setlist ID']).padStart(3, '0');
              }
            });

            callback(results.data);
          },
        });
      },
    });
  }

  // Example usage for songs.csv
  loadCSVFile('songs.csv', function(data) {
    // 'data' now contains the parsed CSV data for songs
    songs = data;

    // Call the function to populate the song list
    populateSongList();
  });

  // Example usage for setlists.csv
  loadCSVFile('setlists.csv', function(data) {
    // You can process and use this data to populate your setlist list
    setlists = data;

    // Call the function to populate the setlist list
    populateSetlistList();
  });

  // Function to populate the song list in the menu
  function populateSongList() {
    // Check if 'songs' is defined and is an array
    if (!Array.isArray(songs)) {
      console.error("Songs data is not available or is not an array.");
      return;
    }
    // Sort the 'songs' array alphabetically based on the song title
    songs.sort(function(a, b) {
      // Check if 'Song title' property exists in both objects
      if (a['Song title'] && b['Song title']) {
        return a['Song title'].localeCompare(b['Song title']);
      }
      // If 'Song title' property is missing in one or both objects, return 0
      return 0;
    });

    // Function to create an array of song paths
    function createSongPathsArray(songsArray) {
      
      songsArray.forEach(function (song) {
        var filePath = songsPath + song['Filename of Songtext'];
        songPathsArray.push(filePath);
      });

      return songPathsArray;
    }

    var songPaths = createSongPathsArray(songs);

    // Preload external files
    function preloadFiles(filePaths) {
      filePaths.forEach(function (filePath) {
        var link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'fetch';
        link.href = filePath;
        document.head.appendChild(link);
      });

    }

    preloadFiles(songPaths);

    // Get the ul element by its ID
    var songList = $('#song-list');

    // Clear existing list items
    songList.empty();

    // Iterate through the sorted songs array and create list items
    for (var i = 0; i < songs.length; i++) {
      var song = songs[i];
      var listItem = $('<li>')
        .attr('data-song-id', song['Song ID'])
        .attr('data-path', 'song-texts/' + song['Filename of Songtext'])
        .text(song['Song title'] + ' - ' + song['Artist Name']);

      // Append the list item to the song list
      songList.append(listItem);
    }
  }

  // Function to populate the setlist list in the menu
  function populateSetlistList() {
    // Check if 'setlists' is defined and is an array
    if (!Array.isArray(setlists)) {
      console.error("Setlists data is not available or is not an array.");
      return;
    }

    // Get the ul element by its ID
    var setlistList = $('#setlist-list');

    // Clear existing list items
    setlistList.empty();

    // Iterate through the sorted setlists array and create list items
    for (var i = 0; i < setlists.length; i++) {
      var setlist = setlists[i];
      var listItem = $('<li>')
        .attr('data-setlist-id', setlist['Setlist ID'])
        .attr('data-path', 'setlists/' + setlist['Filename of Setlist'])
        .text(setlist['Setlist Name']);

      // Append the list item to the setlist list
      setlistList.append(listItem);
    }
  }

  // Event delegation for song list item click
  $('#song-list').on('click', 'li', function() {
    setlistMode = false;
    setSetlistMode();
    $("#menu").hide();
    // Get the data-path attribute value
    var songPath = $(this).attr('data-path');

    // Load the HTML content of the song
    loadSongHtml(songPath);
    //return false;
  });

  // Function to load the HTML content of a song
  function loadSongHtml(songPath) {
    $.ajax({
      url: songPath + '?_=' + new Date().getTime(),
      dataType: 'html',
      success: function(htmlContent) {
        // Use DOMParser to parse the HTML string
        var parser = new DOMParser();
        var doc = parser.parseFromString(htmlContent, 'text/html');

        // Extract the body content
        var bodyContent = doc.body.innerHTML;

        // Inject the body content into the main-song-text-area div
        window.scrollTo(0, 0);
        $('#main-song-text-area').html(bodyContent);
      },
      error: function() {
        console.error('Error loading song HTML.');
      }
    });
  }


  // Function to load and interpret setlist from a text file
  function loadSetlist(setlistPath) {
    return new Promise(function(resolve, reject) {
      $.ajax({
        url: setlistPath,
        dataType: 'text',
        success: function(textContent) {
          // Split the text content into an array of song IDs
          var songIDs = textContent.trim().split('\r\n');

          // Build an array with corresponding song information from songs.csv
          setlistArray = buildSetlistArray(songIDs);

          // Resolve the Promise with the setlist array
          resolve(setlistArray);
        },
        error: function() {
          reject('Error loading setlist text file.');
        }
      });
    });
  }

  // Function to build an array with corresponding song information
  function buildSetlistArray(songIDs) {
    setlistArray = [];

    // Iterate through song IDs and fetch corresponding information from songs.csv
    songIDs.forEach(function(songID) {
      var trimmedSongID = songID.trim();  // Trim the song ID
      var songInfo = findSongInfo(trimmedSongID);
      
      if (songInfo) {
        setlistArray.push(songInfo);
      }
    });

    return setlistArray;
  }

  // Function to find song information from songs.csv
  function findSongInfo(songID) {
    // Assuming 'songs' array is already available (loaded from CSV)
    var song = songs.find(function(song) {
      return song['Song ID'] === songID;
    });

    return song;
  }

  // Function to populate the setlist song list
  function populateSetlist(setlistArray) {
    // Get the setlist song list
    var setlistSongList = $('#setlist-song-list');

    // Clear existing list items
    setlistSongList.empty();

    // Iterate through setlist array and create list items
    setlistArray.forEach(function(song, index) {
      var listItem = $('<li>')
        .attr('data-song-id', song['Song ID'])
        .attr('data-path', 'song-texts/' + song['Filename of Songtext'])
        .attr('data-index', index)  // Add the data-index attribute
        .text(song['Song title'] + ' - ' + song['Artist Name']);

      // Append the list item to the setlist song list
      setlistSongList.append(listItem);
    });

  }

  // Event delegation for setlist list item click
  $('#setlist-list').on('click', 'li', function() {
    setlistMode = true;
    setSetlistMode();
    $("#menu").hide();
    // Get the data-path attribute value
    var setlistPath = $(this).attr('data-path');

    activeSetlistName = $(this).text();
    $('#setlist h2').text(activeSetlistName);

    // Load and interpret the setlist from the text file
    loadSetlist(setlistPath)
      .then(function() {
        populateSetlist(setlistArray);
        
        // Check if setlistArray is not empty before accessing its first element
        if (setlistArray && setlistArray.length > 0) {
          var firstSetlistSongPath = 'song-texts/' + setlistArray[0]['Filename of Songtext'];

          loadSongHtml(firstSetlistSongPath);
          initSetlistControls();
        }
      })
      .catch(function(error) {
        console.error(error);
      });
      return false;
  });

  function initSetlistControls(){
    setlistTotalSongnumber = String(setlistArray.length).padStart(2, '0');

    $('#total-song-number').text(setlistTotalSongnumber);

    currentSetlistSongnumber = 0
    $('#current-song-number').text(String(currentSetlistSongnumber + 1).padStart(2, '0'));
    
    $('#previous-song-button').prop('disabled', true);
    $('#next-song-button').prop('disabled', false);
    
    nextSetlistSongnumber = 1;
    previousSetlistSongnumber = -1;

    console.log(previousSetlistSongnumber+':'+currentSetlistSongnumber+':'+nextSetlistSongnumber);

    nextSongButtonText = $('#setlist-song-list li').eq(nextSetlistSongnumber).text();
    $('#next-song-button-text').text(nextSongButtonText);

    $('#setlist-song-list li:first').addClass('current');
  };

  $('#next-song-button').on('click', function() {
    navDirection = "forward";
    setlistNavigate();
  });

  $('#previous-song-button').on('click', function() {
    navDirection = "back";
    setlistNavigate();
  });

  function setlistNavigate() {
    if (navDirection === "forward") {
      currentSetlistSongPath = $('#setlist-song-list li').eq(nextSetlistSongnumber).attr('data-path');
      previousSetlistSongnumber = previousSetlistSongnumber + 1;
      currentSetlistSongnumber = currentSetlistSongnumber + 1;
      nextSetlistSongnumber = nextSetlistSongnumber + 1;
      console.log(previousSetlistSongnumber+':'+currentSetlistSongnumber+':'+nextSetlistSongnumber);
    }
    if (navDirection === "back") {
      currentSetlistSongPath = $('#setlist-song-list li').eq(previousSetlistSongnumber).attr('data-path');
      previousSetlistSongnumber = previousSetlistSongnumber - 1;
      currentSetlistSongnumber = currentSetlistSongnumber - 1;
      nextSetlistSongnumber = nextSetlistSongnumber - 1;
      console.log(previousSetlistSongnumber+':'+currentSetlistSongnumber+':'+nextSetlistSongnumber);
    }
    
    loadSongHtml(currentSetlistSongPath);
    updateControls();
  };

  function updateControls() {
    if (nextSetlistSongnumber + 1 > setlistTotalSongnumber) {
      $('#next-song-button').prop('disabled', true);
    } else {
      $('#next-song-button').prop('disabled', false);
    }
  
    if (previousSetlistSongnumber === -1) {
      $('#previous-song-button').prop('disabled', true);
    } else {
      $('#previous-song-button').prop('disabled', false);
    }
  
    $('#setlist-song-list li').removeAttr("class");
    $('#setlist-song-list li').eq(currentSetlistSongnumber).addClass('current');
  
    nextSongButtonText = $('#setlist-song-list li').eq(nextSetlistSongnumber).text();
    if (nextSetlistSongnumber + 1 > setlistTotalSongnumber) {
      $('#next-song-button-text').text('End of Setlist');
    } else {
      $('#next-song-button-text').text(nextSongButtonText);
    }
    
    $('#current-song-number').text(String(currentSetlistSongnumber + 1).padStart(2, '0'));
  };

  $('#setlist-song-list').on('click', 'li', function() {
    var setlistSongPath = $(this).attr('data-path');
    loadSongHtml(setlistSongPath);
    currentSetlistSongnumber = Number($(this).attr('data-index'));
    previousSetlistSongnumber = currentSetlistSongnumber - 1;
    nextSetlistSongnumber = currentSetlistSongnumber + 1;
    console.log(previousSetlistSongnumber+':'+currentSetlistSongnumber+':'+nextSetlistSongnumber);
    updateControls();
    $("#setlist").hide();
    return false;
  });

  function setSetlistMode() {
    if (setlistMode === false) {
      $('#setlist-controls').hide();
      $('body').removeClass("setlist-mode");
    }
    if (setlistMode === true) {
      $('#setlist-controls').show();
      $('body').addClass("setlist-mode");
    }
  };

  $('#open-menu').on('click', function() {
    $("#menu").show();
  });

  $('#close-menu').on('click', function() {
    $("#menu").hide();
  });

  $('#open-setlist').on('click', function() {
    $("#setlist").show();
  });

  $('#close-setlist').on('click', function() {
    $("#setlist").hide();
  });

  $(document).keydown(function(e) {
    if (setlistMode === true) {
      var nextDisabled = $("#next-song-button").prop("disabled");

      var prevDisabled = $("#previous-song-button").prop("disabled");

      if (nextDisabled === false) {
        // Check if the pressed key is the right arrow key (keyCode 39)
        if (e.keyCode == 39) {
          //alert("Test");
          $("#next-song-button").trigger("click");
        }
      }
      if (prevDisabled === false) {
        // Check if the pressed key is the right arrow key (keyCode 39)
        if (e.keyCode == 37) {
          //alert("Test");
          $("#previous-song-button").trigger("click");
        }
      }
    }
  });


});