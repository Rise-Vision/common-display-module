#!/bin/bash
VERSION=$(cat version)
OUTPUTDIR="beta/"
MANIFESTFILES="display-modules-beta*.json"

if [ "$MODULENAME" = "" ]; exit 1; fi

if [ $BRANCH = "STABLE" ]; then OUTPUTDIR=""; fi
if [ $BRANCH = "STABLE" ]; then MANIFESTFILES="display-modules-*.json"; fi

echo "deploying $VERSION"

git clone git@github.com:Rise-Vision/private-keys.git
gcloud auth activate-service-account 452091732215@developer.gserviceaccount.com --key-file ./private-keys/storage-server/rva-media-library-ce0d2bd78b54.json

mkdir -p manifests
gsutil -m cp gs://install-versions.risevision.com/${OUTPUTDIR}${MANIFESTFILES} manifests
find manifests -name "*.json" -exec node ./node_modules/common-display-module/update-module-version.js '{}' $MODULENAME $VERSION 0 \;

gsutil -m cp manifests/*.json gs://install-versions.risevision.com/staging/$MODULENAME/$VERSION
gsutil setmeta -h "Cache-Control:private, max-age=0" gs://install-versions.risevision.com/staging/$MODULENAME/$VERSION/*
gsutil setmeta -h "Content-Disposition:attachment" gs://install-versions.risevision.com/staging/$MODULENAME/$VERSION/*.sh
gsutil acl ch -u AllUsers:R gs://install-versions.risevision.com/staging/$MODULENAME/$VERSION/*
gsutil -m cp -p gs://install-versions.risevision.com/${OUTPUTDIR}*.{sh,exe,json} gs://install-versions.risevision.com/backups/$VERSION
gsutil -m cp -p gs://install-versions.risevision.com/staging/$MODULENAME/$VERSION/* gs://install-versions.risevision.com/$OUTPUTDIR

if [ $BRANCH == "STABLE" ]
then
  echo -n "RisePlayerElectron $VERSION" > latest-version
  gsutil cp latest-version gs://install-versions.risevision.com
  gsutil setmeta -h "Cache-Control:private, max-age=0" gs://install-versions.risevision.com/latest-version
  gsutil setmeta -h "Content-Type:text/plain" gs://install-versions.risevision.com/latest-version
  gsutil acl ch -u AllUsers:R gs://install-versions.risevision.com/latest-version
fi
