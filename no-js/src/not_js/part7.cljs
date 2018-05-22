(ns not-js.part7
  (:require
   [clojure.string :as str]
   [not-js.common :as common]))

(defn check [n]
  (= "PVw6U2ZmYV1hRVAyUS9IW1tWUlY6RTJRL0hbW1ZSVjpFMlEvSFtbVlJWOkUyUS9IW1tWUlY6RT9ePFVoaGNfY0dSP148VWhoY19jR1IePRs0R0dCPkImMUZlQ1xvb2pmak5ZMlEvSFtbVlJWOkU4VzVOYWFcWFxASzZVM0xfX1pWWj5JNlUzTF9fWlZaPkk2VTNMX19aVlo+STZVM0xfX1pWWj5JDy4MJTg4My8zFyI="
     (js/window.btoa
      (str/join
       ""
       (mapv
        #(js/String.fromCharCode %)
        (mapv
         #(.toString %)
         (for [x (common/stringToInt n)
               y (apply conj (apply conj '(22 33) (common/stringToInt "okotta")) [11 45 14])]
           (+ x y))))))))
