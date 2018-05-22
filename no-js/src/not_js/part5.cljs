(ns not-js.part5
  (:refer-clojure :exclude [hash])
  (:require
   [goog.crypt :as crypt]
   [clojure.string :as str]
   [goog.crypt.Md5 :as Md5]))

(defn string->bytes [s]
  (crypt/stringToUtf8ByteArray s))

(defn bytes->hex
  [bytes-in]
  (crypt/byteArrayToHex bytes-in))

(defn digest [hasher bytes]
  (.update hasher bytes)
  (.digest hasher))

(defn hash-bytes [s hash-type]
  (digest
   (case hash-type
     :md5 (goog.crypt.Md5.))
   (string->bytes s)))

(defn hash [s hash-type & [hex?]]
  (let [hashed (hash-bytes s hash-type)]
    (if hex? (bytes->hex hashed) hashed)))

(defn check [s] (js/window.eval (str "var j=window['IBnitg'.split('').sort().map((a,i)=>i===1?a.toLowerCase():i===3?a.toUpperCase():a).join('')],w=j[btoa('jÂ\\'´').split('').slice(0,5).join('')+'N'];w(256,\"276839132707622690534147184366986393054208\")===[" (str/join "," (hash s :md5)) "].map(j).reduce((a, b)=>a*256n+b)<<10n")))

(do (meta #'check))
