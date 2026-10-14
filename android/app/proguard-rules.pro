# Capacitor's own consumer rules keep plugins and @PluginMethod methods.
# These cover the bridge pieces the WebView reaches by name.

-keep class com.getcapacitor.** { *; }
-keep class in.pidaka.app.** { *; }
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Readable crash stack traces in Play Console (Play applies the mapping file).
-keepattributes SourceFile,LineNumberTable,*Annotation*,Signature,InnerClasses,EnclosingMethod
-renamesourcefileattribute SourceFile
