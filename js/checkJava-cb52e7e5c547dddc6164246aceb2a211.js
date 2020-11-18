var browserInfo = navigator.userAgent;

// variable to check if Java Web Start is installed
var jwsInstalled = 0;

// Microsoft VM?
var msvmInstalled = 0;

// Sun VM?
var sunvmInstalled = 0;


// variable to check if client is MSIE
isIE = "false";

// If we are using 
if(navigator.mimeTypes && navigator.mimeTypes.length)
{
  var flag = navigator.mimeTypes['application/x-java-jnlp-file'];

  if(flag)
  {
	jwsInstalled = 1;
  }
}
else
{
  isIE = "true";
}

// We are using another browser, not MSIE
// Opera, Mozilla, Firefox, etc...
if(isIE == "false")
{
	javaEnabled = window.navigator.javaEnabled();
	alert("javaEnabled: "+ javaEnabled );
  if(javaEnabled)
  {
	javaVendor = java.lang.System.getProperty("java.vendor");
	alert("javaVendor: "+ javaVendor );
	if(javaVendor.indexOf("Sun ") != -1 || javaVendor.IndexOf("sun ") != -1)
	{
	  sunvmInstalled = 1;
	}
  }
}
// Our client is using MSIE
else
{
  // check if ActiveX objects can be created
  try
  {
	// Create Sun Java plugin ActiveX object
	var pluginObject = new ActiveXObject("JavaPlugin");
	// Create Java Web Start ActiveX object
	var jwsObject = new ActiveXObject("JavaWebStart.isInstalled");
  }
  // they cannot be created
  catch(e)
  {
	// Sun Java plugin and Java Web Start not installed
	sunvmInstalled = 0;
	jwsInstalled = 0;
  }

  // Sun Java VM object successfully created?
  if(pluginObject)
  {
	// Yep! We have the Sun Java VM plugin installed
	sunvmInstalled = 1;
  }

  // Java Web Start object successfully created?
  if(jwsObject)
  {
	// Yep! We have Java Web Start installed
	jwsInstalled = 1;
  }

  // Minimal Code Hack
  // All versions of Windows up to 2000 have Microsoft VM installed by default
  // No official Microsoft VM is distributed for Windows XP and above
  // Users of Windows XP and above will be required to install the Sun Virtual Machine
  var UserAgent = navigator.userAgent;

  if(UserAgent.indexOf("Windows 95") != -1 || UserAgent.indexOf("Windows 98") != -1 || UserAgent.indexOf("Windows NT 5.0") != -1)
  {
	msvmInstalled = 1;
  }
}
