#!/usr/bin/env bash

# url for oracle instantclient installation script
# https://gist.github.com/crynobone/ca56ca2b5bea39eb397d
# url for linux x86-x64 oracle instantclient downloads
# http://www.oracle.com/technetwork/topics/linuxx86-64soft-092277.html

SMTP_RELAY=''

# sets a variable so that phpmyadmin installs in noninteractive mode
export DEBIAN_FRONTEND=noninteractive

# password that will be used with MySQL Server 5.5 and PHPMyAdmin
DBUSER='root'
DBNAME='dev'
PASSWORD='root'
DBPASSWD=$PASSWORD

# apache document root; dynamically change the document root if /web or /html exists
DOCUMENT_ROOT='/var/www'
DOCUMENT_ROOT_UNCHANGED=1

# seems like you must have the space after the opening bracket and before the closing bracket
#[ -d /vagrant/web ] && DOCUMENT_ROOT='/var/www/web' && echo 'Application directory "web/" selected as DocumentRoot'
#[ -d /vagrant/html ] && DOCUMENT_ROOT='/var/www/html' && echo 'Application directory "html/" selected as DocumentRoot'

# Locale
LOCALE_LANGUAGE="en_US" # can be altered to your prefered locale, see http://docs.moodle.org/dev/Table_of_locales
LOCALE_CODESET="en_US.UTF-8"

# Timezone
TIMEZONE="America/New_York" # can be altered to your specific timezone, see http://manpages.ubuntu.com/manpages/jaunty/man3/DateTime::TimeZone::Catalog.3pm.html

# location of the oracle instantclient files needed to install the oci8 driver for PHP
SHARED_DIR='/vagrant/shared'

ORACLE_HOME='/opt/oracle/instantclient'

# make sure all three of the next values match according to version or it will fail...
INSTANT_ZIP_VERSION='linux.x64-12.1.0.2.0' #linux (x86-x64 version)
INSTANT_WORKING_FOLDER='instantclient_12_1'
INSTANT_MAJOR_VERSION='12'

# Set Locale, see https://help.ubuntu.com/community/Locale#Changing_settings_permanently
echo "[vagrant provisioning] Setting locale..."
locale-gen $LOCALE_LANGUAGE $LOCALE_CODESET

# Set timezone, for unattended info see https://help.ubuntu.com/community/UbuntuTime#Using_the_Command_Line_.28unattended.29
echo "[vagrant provisioning] Setting timezone..."
echo $TIMEZONE | tee /etc/timezone
dpkg-reconfigure --frontend noninteractive tzdata

### Apache + PHP
echo "Updating Apt-Get..."
apt-get update > /dev/null 2>&1
apt-get upgrade -y > /dev/null 2>&1

echo -e 'Installing Essentials...\r\n'
apt-get install -y make vim nano curl python-software-properties build-essential unzip rpm git-core git wget rsync sendmail > /dev/null 2>&1
apt-get install -y debconf-utils dbconfig-common > /dev/null 2>&1

#Set MySQL root password
debconf-set-selections <<< "mysql-server mysql-server/root_password password $PASSWORD"
debconf-set-selections <<< "mysql-server mysql-server/root_password_again password $PASSWORD"

### Set phpmyadmin passwords to root as well
debconf-set-selections <<< "phpmyadmin phpmyadmin/reconfigure-webserver multiselect apache2"
debconf-set-selections <<< "phpmyadmin phpmyadmin/dbconfig-install boolean true"
debconf-set-selections <<< "phpmyadmin phpmyadmin/mysql/admin-user string root"
debconf-set-selections <<< "phpmyadmin phpmyadmin/mysql/app-pass password $PASSWORD"
debconf-set-selections <<< "phpmyadmin phpmyadmin/mysql/admin-pass password $PASSWORD"
debconf-set-selections <<< "phpmyadmin phpmyadmin/app-password-confirm password $PASSWORD"

#echo "phpmyadmin phpmyadmin/reconfigure-webserver multiselect apache2" | debconf-set-selections
#echo "phpmyadmin phpmyadmin/dbconfig-install boolean true" | debconf-set-selections
#echo "phpmyadmin phpmyadmin/mysql/admin-user string root" | debconf-set-selections
#echo "phpmyadmin phpmyadmin/mysql/app-pass password $PASSWORD" | debconf-set-selections
#echo "phpmyadmin phpmyadmin/mysql/admin-pass password $PASSWORD" | debconf-set-selections
#echo "phpmyadmin phpmyadmin/app-password-confirm password $PASSWORD" | debconf-set-selections

 echo "--- configure apache, sets the document root --- "
   rm -rf /var/www
   ln -fs /vagrant /var/www

echo -e 'Installing Apache 2...\r\n'
apt-get install -y apache2 apache2-utils > /dev/null 2>&1

# seems like this needs to happen AFTER the symbolic link is made
# follows the way that openshift sets the document root:
# https://developers.openshift.com/en/php-getting-started.html#set-document-root
if [ -d /vagrant/php ]; then
DOCUMENT_ROOT='/var/www/php'
elif [ -d /vagrant/public ]; then
DOCUMENT_ROOT='/var/www/public'
elif [ -d /vagrant/public_html ]; then
DOCUMENT_ROOT='/var/www/public_html'
elif [ -d /vagrant/web ]; then
DOCUMENT_ROOT='/var/www/web'
elif [ -d /vagrant/www ]; then
DOCUMENT_ROOT='/var/www/www'
else
  DOCUMENT_ROOT_UNCHANGED=0
fi

if [[ "$DOCUMENT_ROOT_UNCHANGED" == 1 ]]; then
sed -i "s#DocumentRoot /var/www/html#DocumentRoot $DOCUMENT_ROOT#g" /etc/apache2/sites-available/000-default.conf
sed -i "s#DocumentRoot /var/www/html#DocumentRoot $DOCUMENT_ROOT#g" /etc/apache2/sites-enabled/000-default.conf
sed -i "s#DocumentRoot /var/www/html#DocumentRoot $DOCUMENT_ROOT#g" /etc/apache2/apache2.conf
echo "Application directory $DOCUMENT_ROOT selected as DocumentRoot"
fi


# change allowoverride from none to all in conf files
sed -i "s/AllowOverride None/AllowOverride All/g" /etc/apache2/apache2.conf

### enable Apache mod_rewrite
a2enmod rewrite

echo -e "\r\nSetEnv LD_LIBRARY_PATH $LD_LIBRARY_PATH" >> /etc/apache2/apache2.conf

echo "Restarting Apache Service..."
service apache2 restart

apt-get install -y openssl php5-dev > /dev/null 2>&1
# Linux kernel AIO access library
apt-get install -y libaio1 libaio-dev re2c > /dev/null 2>&1
apt-get install -y php5 libapache2-mod-php5 php5-cli php5-mcrypt php5-gd php5-ldap php5-json > /dev/null 2>&1
apt-get install -y php5-curl php5-common php5-fpm php5-curl php5-intl php5-xsl > /dev/null 2>&1

  echo "--- Installing and configuring Xdebug ---"
  apt-get install -y php5-xdebug > /dev/null 2>&1

  #mod for xdebug from Jeffrey Way for xdebug - https://github.com/JeffreyWay/Vagrant-Setup
  #xdebug configuration settings explained here - http://www.xdebug.org/docs/all_settings
cat << EOF | tee -a /etc/php5/mods-available/xdebug.ini
;xdebug.scream=1
xdebug.cli_color=1
xdebug.show_local_vars=1
EOF

apt-get install -y git-core git > /dev/null 2>&1
apt-get install -y wget php-pear sendmail > /dev/null 2>&1
pear channel-update pear.php.net
pear upgrade --force xml_util
pear upgrade-all
pecl upgrade
pear install -a Console_GetoptPlus
pear install -a mail
pear install -a mail_mime

echo "Restarting Apache Service..."
service apache2 restart
echo "Finished restarting Apache."

echo "Installing MySQL Server 5.5...\r\n"
apt-get install -y -qq php5-mysql php5-sqlite > /dev/null 2>&1
apt-get install -y mysql-server-5.5 > /dev/null 2>&1
echo "Installing phpmyadmin..."
apt-get install phpmyadmin

# add include for phpmyadmin for apache
#echo -e "\r\nInclude /etc/phpmyadmin/apache.conf" >> /etc/apache2/apache2.conf

echo -e "\n--- We definitely need to see the PHP errors, turning them on ---\n"
sed -i "s/error_reporting = .*/error_reporting = E_ALL/" /etc/php5/apache2/php.ini
sed -i "s/display_errors = .*/display_errors = On/" /etc/php5/apache2/php.ini
sed -i '/html_errors = Off/c html_errors = On' /etc/php5/apache2/php.ini

echo "--- Install Composer ---"
curl -sS https://getcomposer.org/installer | php
mv composer.phar /usr/local/bin/composer

echo "Installing Oracle Instantclient drivers..."
if [ -f $SHARED_DIR/instantclient-basic-$INSTANT_ZIP_VERSION.zip ]; then
    echo "Found $SHARED_DIR/instantclient-basic-$INSTANT_ZIP_VERSION.zip file."
else
    echo "!!! Missing $SHARED_DIR/instantclient-basic-$INSTANT_ZIP_VERSION.zip file."
    exit 1;
fi

if [ -f $SHARED_DIR/instantclient-sdk-$INSTANT_ZIP_VERSION.zip ]; then
    echo "Found $SHARED_DIR/instantclient-sdk-$INSTANT_ZIP_VERSION.zip file."
else
    echo "!!! Missing $SHARED_DIR/instantclient-sdk-$INSTANT_ZIP_VERSION.zip file."
    exit 1;
fi

cd /tmp
cp $SHARED_DIR/instantclient-* .

cd /opt
if [ -d /opt/oracle ]; then
    rm -Rf oracle
fi

mkdir oracle
cd /opt/oracle
unzip /tmp/instantclient-basic-$INSTANT_ZIP_VERSION.zip > /dev/null 2>&1
unzip /tmp/instantclient-sdk-$INSTANT_ZIP_VERSION.zip > /dev/null 2>&1
ln -s /opt/oracle/$INSTANT_WORKING_FOLDER /opt/oracle/instantclient
cp -R /opt/oracle/$INSTANT_WORKING_FOLDER/sdk/* /opt/oracle/$INSTANT_WORKING_FOLDER

cd /opt/oracle/$INSTANT_WORKING_FOLDER
cp sdk/include/* .

ln -s libclntshcore.so.$INSTANT_MAJOR_VERSION.1 libclntshcore.so
ln -s libclntsh.so.$INSTANT_MAJOR_VERSION.1 libclntsh.so
ln -s libocci.so.$INSTANT_MAJOR_VERSION.1 libocci.so
ln -s libnnz$INSTANT_MAJOR_VERSION.so libnnz.so

echo '/opt/oracle/instantclient/' | tee -a /etc/ld.so.conf.d/oracle_instant_client.conf
ldconfig > /dev/null 2>&1

chown -R root:www-data /opt/oracle
chown -R root:root /opt/oracle/instantclient/
chmod -R g+x /opt/oracle/instantclient/

# values needed in order to install the Oracle InstantClient (drivers)
export LD_LIBRARY_PATH=$ORACLE_HOME
export ORACLE_HOME=$ORACLE_HOME
export TNS_ADMIN=/opt/oracle/tns

cd $ORACLE_HOME
mkdir /opt/oracle/src
cd /opt/oracle/src
pecl download oci8 > /dev/null 2>&1
tar -xvf oci8-* > /dev/null 2>&1
cd oci8-*
phpize > /dev/null 2>&1
./configure --with-oci8=share,instantclient,/opt/oracle/instantclient > /dev/null 2>&1
make > /dev/null 2>&1
make install > /dev/null 2>&1

echo -e "\r\nextension=oci8.so" >> /etc/php5/fpm/php.ini
echo -e "\r\nextension=oci8.so" >> /etc/php5/cli/php.ini
echo -e "\r\nextension=oci8.so" >> /etc/php5/apache2/php.ini

echo "Install Node.js and NPM..."
# this is the official way to install the latest version of NodeJS and NPM
# proof - https://github.com/nodesource/distributions
# yes, the package is only nodejs; it installs NPM as well
# https://nodejs.org/en/
curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -
apt-get install -y nodejs

echo "Restarting PHP and Apache..."
service php5-fpm restart
service apache2 restart

### clean up by removing obsolete packages
echo "Cleaning up obsolete packages..."
apt-get autoremove -y -q
