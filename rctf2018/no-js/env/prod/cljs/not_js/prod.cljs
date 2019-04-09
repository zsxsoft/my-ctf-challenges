(ns not-js.prod
  (:require
    [not-js.core :as core]))

;;ignore println statements in prod
(set! *print-fn* (fn [& _]))

(core/init!)
