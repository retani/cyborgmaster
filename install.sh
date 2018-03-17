#!/bin/bash

echo "checking for xcode tools"
while xcode-select --install
do
  echo "waiting to finish installation of xcode tools"
  sleep 5
done

echo "getting repository..."
git clone --recurse-submodules -b fic https://github.com/retani/cyborgmaster.git
cd cyborgmaster/

echo "getting node version manager n..."
git clone https://github.com/tj/n.git
cd n
sudo make install
cd ..
rm -rf n

echo "setting node version..."
sudo n 8

echo "getting meteor..."
curl https://install.meteor.com/ | sh

echo "npm install..."
meteor npm install

echo "starting apache..."
sudo apachectl start

echo "linking..."
sudo mkdir /Library/WebServer/Documents/media
sudo chmod g+w /Library/WebServer/Documents/media/
sudo ln -sf /Library/WebServer/Documents/media ./media

echo "getting example content..."
sudo cp /Library/WebServer/Documents/PoweredByMacOSX.gif /Library/WebServer/Documents/media/
sudo curl http://playmaster.club/Silent%20Video%20for%20Testing.mov -o "/Library/WebServer/Documents/media/Silent Video for Testing.mov"

echo "Start by running \"meteor\" in \"cyborgmaster\" folder. Exit with Contol-C."
#meteor