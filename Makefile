deploy:
	npm run build
	sudo rsync -avh /home/hj/js/qcomposer/build/ /var/www/html/
