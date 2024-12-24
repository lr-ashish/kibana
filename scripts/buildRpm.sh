#!/bin/bash

# Copyright 2019 LogRhythm, Inc
# Licensed under the LogRhythm Global End User License Agreement,
# which can be found through this page: https://logrhythm.com/about/logrhythm-terms-and-conditions/

if [ $# -ne 1 ] ; then
    echo 'Usage:  sh buildRpm <KIBANA-OFFICIAL-BRANCH>'
    exit 1
fi
set -e
set -x

PACKAGE=kibana
GIT_VERSION=`git rev-list --branches HEAD | wc -l`
GIT_BRANCH="$1"
VERSION="$GIT_BRANCH.$GIT_VERSION"
PWD=`pwd`

sudo rm -rf ~/rpmbuild
rpmdev-setuptree
cp packaging/$PACKAGE.spec ~/rpmbuild/SPECS
rm -f $PACKAGE-$VERSION.tar.gz
tar cf ~/rpmbuild/SOURCES/$PACKAGE-$VERSION.tar -C $PWD .
rpmbuild -v -bb --define="version ${VERSION}" --define="kibana_version ${GIT_BRANCH}" --target=x86_64 ~/rpmbuild/SPECS/$PACKAGE.spec
