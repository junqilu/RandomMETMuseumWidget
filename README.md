# RandomMETMuseumWidget
This protocol aims to provide a widget that can display an art object from the MET museum at random and with automatic refresh

# Requirements 
Scriptable

MET API: https://metmuseum.github.io/ 

# MET API calling 
It seems like IOS doesn't give Scriptable script lots of time before time out on widget, so randomly trying each `objectID` until finding one that has images will likely give you a blank widget on the screen while the script itself can work normally inside Scriptable
* Solution options 
  * Use the API's Search query
    * Downside: you have to provide a `q` parameter as the search term and you can't leave it as blank. Giving an empty str as the `q` will give you a tiny portion of the `objectID` since `q=''` really matches the objects whose search term is an empty str
  * Filter all the `objectID` in advance and store that list on your iPhone. The script will randomly pick 1 `objectID` from that list
    * Downside: might need periodic update on the list

Access prefiltered objectID list: 
1. Save the list from your laptop to iCloud 
2. Open Scriptable and click the top left corner switches icon to open the menu 
3. Find File bookmarks and tap the top right `+` to add a bookmark 
4. Find the file you want to bookmark and give the bookmark a name
5. In your code, you can access the file by `bookmarkedPath(bookmarn_name)`