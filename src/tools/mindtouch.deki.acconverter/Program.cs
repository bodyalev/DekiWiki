using System;
using System.Collections.Generic;
using System.Text;
using MindTouch.Xml;

using MindTouch.Dream;

using MindTouch.Tools.ConfluenceConverter.Confluence;
using MindTouch.Tools.ConfluenceConverter.XMLRPC;
using MindTouch.Tools.ConfluenceConverter.XMLRPC.Types;

namespace MindTouch.Tools.ConfluenceConverter {
    class Program {
        static void Main(string[] args) {

            using(System.IO.StreamWriter logStream = new System.IO.StreamWriter("mindtouch.deki.acconverter.log")) {
                logStream.AutoFlush = true;
                try {
                    string assemblyName = System.IO.Path.GetFileName(System.Reflection.Assembly.GetExecutingAssembly().Location);
                    string configFileName = assemblyName + ".xml";
                    if(!System.IO.File.Exists(configFileName)) {
                        string mess = "File: \"" + configFileName + "\" not found";
                        logStream.WriteLine(mess);
                        Console.WriteLine(mess);
                        Console.ReadLine();
                        return;
                    }

                    XDoc settings = XDocFactory.LoadFrom(configFileName, MimeType.XML);
                    if(settings.IsEmpty) {
                        string mess = "Invalid settings file";
                        logStream.WriteLine(mess);
                        Console.WriteLine(mess);
                        Console.ReadLine();
                        return;
                    }

                    string confluenceAPIUrl = settings["ConfluenceAPIUrl"].AsText;
                    string ConfluenceXMLRPCUrl = settings["ConfluenceXMLRPCUrl"].AsText;
                    string confluenceUserName = settings["ConfluenceUserName"].AsText;
                    string confluenceUserPassword = settings["ConfluenceUserPassword"].AsText;
                    string dreamAPIUrl = settings["DreamAPIUrl"].AsText;
                    string dekiUserName = settings["DekiUserName"].AsText;
                    string dekiUserPassword = settings["DekiUserPassword"].AsText;
                    bool? compatibleConvertUserPermissions = settings["CompatibleConvertUserPermissions"].AsBool;
                    bool processNewsPages = settings["ProcessNewsPages"].AsBool ?? true;
                    bool processPersonalSpaces = settings["ProcessPersonalSpaces"].AsBool ?? true;
                    string fallbackSpacePrefix = settings["FallbackSpacePrefix"].AsText;

                    if((confluenceAPIUrl == null) || (confluenceUserName == null) || (confluenceUserPassword == null) ||
                        (dreamAPIUrl == null) || (dekiUserName == null) || (dekiUserPassword == null) ||
                        (!compatibleConvertUserPermissions.HasValue)) {
                        string mess = "Invalid settings file";
                        logStream.WriteLine(mess);
                        Console.WriteLine(mess);
                        Console.ReadLine();
                        return;
                    }

                    List<string> spacesToConvert = new List<string>();
                    if(!settings["SpacesToImport"].IsEmpty) {
                        foreach(XDoc spaceDoc in settings["SpacesToImport"].Elements) {
                            string spaceTitle = spaceDoc.AsText.ToLower();
                            spacesToConvert.Add(spaceTitle);
                        }
                    }

                    bool success = ACConverter.Convert(ConfluenceXMLRPCUrl, confluenceAPIUrl, confluenceUserName, confluenceUserPassword,
                        dreamAPIUrl, dekiUserName, dekiUserPassword, compatibleConvertUserPermissions.Value,
                        spacesToConvert, processNewsPages, processPersonalSpaces, fallbackSpacePrefix);                   
                    
                    if(success) {
                        string mess = "Conversion successfully completed!";
                        logStream.WriteLine(mess);
                        Console.WriteLine(mess);
                    }
                } catch(DreamResponseException e) {
                    string mess = DateTime.Now.ToString("HH:mm:ss", System.Globalization.CultureInfo.InvariantCulture.DateTimeFormat) +
                        "   An unexpected error has occurred:";
                    logStream.WriteLine(mess);
                    logStream.WriteLine(e.Response.ToString());
                    logStream.WriteLine(e);
                    Console.WriteLine(mess);
                    Console.WriteLine(e);
                } catch(System.Web.Services.Protocols.SoapException e) {
                    string mess = DateTime.Now.ToString("HH:mm:ss", System.Globalization.CultureInfo.InvariantCulture.DateTimeFormat) +
                        "   An unexpected error has occurred:";
                    logStream.WriteLine(mess);
                    if((e.Detail != null) && (e.Detail.OuterXml != null)) {
                        logStream.WriteLine(e.Detail.OuterXml);
                    }
                    logStream.WriteLine(e);
                    Console.WriteLine(mess);
                    Console.WriteLine(e);
                } catch(Exception e) {
                    string mess = DateTime.Now.ToString("HH:mm:ss", System.Globalization.CultureInfo.InvariantCulture.DateTimeFormat) +
                        "   An unexpected error has occurred:";
                    logStream.WriteLine(mess);
                    logStream.WriteLine(e);
                    Console.WriteLine(mess);
                    Console.WriteLine(e);
                }
                Console.ReadLine();
            }
        }

        public string GetTinyUrlForPage(string ConfluenceXMLRPCUrl,string confluenceUserName, string confluenceUserPassword, string pageId)
        {
            CFRpcClient client = new CFRpcClient(ConfluenceXMLRPCUrl, confluenceUserName, confluenceUserPassword);
            CFRpcExtensions rpcExt = new CFRpcExtensions(client);
            //List<CFTeamLabels> teamLabels = rpcExt.GetSpaceTeamLables("ds");
            //string spaceTeamLabel = teamLabels[0].Label;
            return rpcExt.GetTinyUrlForPageId(pageId);            
        }

    }
}