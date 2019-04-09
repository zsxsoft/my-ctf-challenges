(ns not-js.part3
  (:require
   [not-js.common :as common]))

(defn check [s] (= (common/base32 s) "0SWCRMLH"))

