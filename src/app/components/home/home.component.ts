import { Component, OnInit, HostListener } from '@angular/core';

import { ElectronService } from '../../providers/electron.service';

import { FinalObject } from '../common/final-object.interface';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: [
    './home.component.scss',
    './search.scss',
    './photon/photon.min.css',
    './gallery.scss',
    './film-override.scss',
    './wizard.scss'
  ]
})
export class HomeComponent implements OnInit {

  // searchButtons & filters -- arrays must be in the same order to correspond correctly !!!

  searchButtons = [
    {
      uniqueKey: 'folderUnion',
      hidden: false,
      toggled: true,
      iconName: 'icon-folder',
      title: 'Folder union search'
    }, {
      uniqueKey: 'folder',
      hidden: false,
      toggled: true,
      iconName: 'icon-folder',
      title: 'Folder search'
    }, {
      uniqueKey: 'fileUnion',
      hidden: false,
      toggled: true,
      iconName: 'icon-video',
      title: 'File union search'
    }, {
      uniqueKey: 'file',
      hidden: false,
      toggled: true,
      iconName: 'icon-video',
      title: 'File search'
    }, {
      uniqueKey: 'magic',
      hidden: false,
      toggled: true,
      iconName: 'icon-search',
      title: 'Magic search'
    }
  ];

  // string = search string, array = array of filters, bool = dummy to flip to trigger pipe
  // array for `file`, `fileUnion`, `folder`, `folderUnion`
  filters = [
    {
     uniqueKey: 'folderUnion',
     string: '',
     array: [], // contains search strings
     bool: true,
     placeholder: 'Search folders union',
     conjunction: 'or'
    }, {
      uniqueKey: 'folder',
      string: '',
      array: [],
      bool: true,
      placeholder: 'Search folders',
      conjunction: 'and'
    }, {
      uniqueKey: 'fileUnion',
      string: '',
      array: [],
      bool: true,
      placeholder: 'Search files union',
      conjunction: 'or'
    }, {
      uniqueKey: 'file',
      string: '',
      array: [],
      bool: true,
      placeholder: 'Search files',
      conjunction: 'and',
    }
  ];

  // Array is in the order in which the buttons will be rendered
  galleryButtons = [
    {
      uniqueKey: 'showThumbnails',
      hidden: false,
      toggled: true,
      iconName: 'icon-layout',
      title: 'Show thumbnails',
      spaceAfter: false,
    }, {
      uniqueKey: 'showFilmstrip',
      hidden: false,
      toggled: false,
      iconName: 'icon-menu',
      title: 'Show filmstrip',
      spaceAfter: false,
    }, {
      uniqueKey: 'showFiles',
      hidden: false,
      toggled: false,
      iconName: 'icon-menu',
      title: 'Show files',
      spaceAfter: true,
    }, {
      uniqueKey: 'showMoreInfo',
      hidden: false,
      toggled: true,              // coincides with `this.showMoreInfo` variable
      iconName: 'icon-tag',
      title: 'Show more info',
      spaceAfter: false,
    }
  ];

  // App state to save -- so it can be exported and saved after closing
  appState = {
    selectedOutputFolder: '',
    selectedSourceFolder: '',
    currentView: 'thumbs', // can be 'thumbs' | 'filmstrip' | 'files'

    buttonsInView: true,

    numberToShow: 20,
  }

  // REORGANIZE / keep
  currentPlayingFile = '';
  currentPlayingFolder = '';
  magicSearchString = '';
  showMoreInfo = true;

  importDone = false;
  inProgress = false;
  progressPercent = 0;

  public finalArray = [];

  constructor(
    public electronService: ElectronService
  ) { }

  ngOnInit() {

    // later -- when restoring saved state from file
    this.showMoreInfo = this.galleryButtons[3].toggled;   // WARNING -- [3] coincides with the button `showMoreInfo`

    // Returning Input
    this.electronService.ipcRenderer.on('inputFolderChosen', (event, filePath) => {
      this.appState.selectedSourceFolder = filePath;
    });

    // Returning Output
    this.electronService.ipcRenderer.on('outputFolderChosen', (event, filePath) => {
      this.appState.selectedOutputFolder = filePath;
    });

    // Progress bar messages
    this.electronService.ipcRenderer.on('processingProgress', (event, a, b) => {
      this.inProgress = true; // handle this variable better later
      console.log(a + ' out of ' + b);
      this.progressPercent = a / b;
    });

    // Final object returns
    this.electronService.ipcRenderer.on('finalObjectReturning', (event, finalObject: FinalObject) => {
      this.appState.selectedOutputFolder = finalObject.outputDir;
      this.appState.selectedSourceFolder = finalObject.inputDir;
      this.importDone = true;
      this.finalArray = finalObject.images;
    });
  }

  public loadFromFile() {
    // console.log('loading file');
    this.electronService.ipcRenderer.send('load-the-file', 'some thing sent');
  }

  public selectSourceDirectory() {
    // console.log('select input directory');
    this.electronService.ipcRenderer.send('choose-input', 'sending some message also');
  }

  public selectOutputDirectory() {
    // console.log('select output directory');
    this.electronService.ipcRenderer.send('choose-output', 'sending some message also');
  }

  public importFresh() {
    // console.log('fresh import');
    this.electronService.ipcRenderer.send('start-the-import', 'sending some message');
  }

  // HTML calls this
  public openVideo(number) {
    this.currentPlayingFolder = this.finalArray[number][0];
    this.currentPlayingFile = this.finalArray[number][2];
    this.openExternalFile(this.appState.selectedSourceFolder + this.finalArray[number][0] + '/' + this.finalArray[number][1]);
  }

  // Open the file in system default program
  public openExternalFile(fullPath) {
    // console.log('trying to open ' + fullPath);
    // console.log('sike! DISABLED :)')
    this.electronService.ipcRenderer.send('openThisFile', fullPath);
  }

  // -----------------------------------------------------------------------------------------------
  // handle output from top.component

  /**
   * Add filter to FILE search when word in file is clicked
   * @param filter
   */
  handleFileWordClicked(filter: string) {
    this.onEnterKey(filter, 3); // 3rd item is the `file` filter
  }

  /**
   * Add filter to FOLDER search when word in folder is clicked
   * @param filter
   */
  handleFolderWordClicked(filter: string) {
    this.onEnterKey(filter, 1); // 1st item is the `folder` filter
  }

  // -----------------------------------------------------------------------------------------------
  // Interaction functions

  toggleSearchButton(button: string) {
    this.searchButtons[button].toggled = !this.searchButtons[button].toggled;
  }

  rotateSettings() {
    this.appState.buttonsInView = !this.appState.buttonsInView;
  }

  // MAYBE CLEAN UP !?!!
  toggleGalleryButton(index: number): void {
    if (index === 0) {
      this.galleryButtons[1].toggled = false;
      this.galleryButtons[2].toggled = false;
      this.galleryButtons[0].toggled = true;
      this.appState.currentView = 'thumbs';
    } else if (index === 1) {
      this.galleryButtons[0].toggled = false;
      this.galleryButtons[2].toggled = false;
      this.galleryButtons[1].toggled = true;
      this.appState.currentView = 'filmstrip';
    } else if (index === 2) {
      this.galleryButtons[0].toggled = false;
      this.galleryButtons[1].toggled = false;
      this.galleryButtons[2].toggled = true;
      this.appState.currentView = 'files';
    } else if (index === 3) {
      this.showMoreInfo = !this.showMoreInfo;
      this.galleryButtons[3].toggled = !this.galleryButtons[3].toggled;
    } else {
      console.log('what did you press?');
      // this.galleryButtons[index].toggled = !this.galleryButtons[index].toggled;
    }

  }

  /**
   * Add search string to filter array
   * When user presses the `ENTER` key
   * @param value  -- the string to filter
   * @param origin -- can be `file`, `fileUnion`, `folder`, `folderUnion` -- KEYS for the `filters` Array
   */
  onEnterKey(value: string, origin: number): void {
    const trimmed = value.trim();
    if (trimmed) {
      this.filters[origin].array.push(trimmed);
      this.filters[origin].bool = !this.filters[origin].bool;
      this.filters[origin].string = '';
    }
  }

  /**
   * Removes last-added filter
   * When user presses the `BACKSPACE` key
   * @param origin  -- array from which to .pop()
   */
  onBackspace(origin: number): void {
    if (this.filters[origin].array.length > 0) {
      this.filters[origin].array.pop();
      this.filters[origin].bool = !this.filters[origin].bool;
    }
  }

  /**
   * Removes item from particular search array
   * When user clicks on a particular search word
   * @param item    {number}  index within array of search strings
   * @param origin  {number}  index within filters array
   */
  removeThisFilter(item: number, origin: number): void {
    this.filters[origin].array.splice(item, 1);
    this.filters[origin].bool = !this.filters[origin].bool;
  }

}
