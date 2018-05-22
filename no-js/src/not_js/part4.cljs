(ns not-js.part4
  (:require
   [not-js.common :as common]))

(defn check [s] (= (common/base32 s) "000EQTPI"))
