(ns ^:figwheel-no-load not-js.dev
  (:require
    [not-js.core :as core]
    [devtools.core :as devtools]))


(enable-console-print!)

(devtools/install!)

(core/init!)
