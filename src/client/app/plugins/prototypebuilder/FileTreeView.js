/**
 * Renders a folder and the list of files and any folders within it.
 * @author Patrick Oladimeji
 * @date 1/14/14 11:53:17 AM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, unparam: true*/
/*global define*/
define(function (require, exports, module) {
    "use strict";
    var eventDispatcher = require("util/eventDispatcher"),
        WSManager		= require("websockets/pvs/WSManager"),
        QuestionForm    = require("pvsioweb/forms/displayQuestion"),
        TreeList        = require("./TreeList");
    
    var elementId, project, ws = WSManager.getWebSocket(), fileCounter = 0, folderCounter = 0,
        unSavedFileName = "untitled_file", unSavedFolderName = "untitled_folder", treeList;
    
    function FileTreeView(_elId, folderData, _project) {
        eventDispatcher(this);
        var ftv = this;
        elementId = _elId;
        project = _project;
    
        treeList = new TreeList(folderData, elementId);
        // FIXME: why are we using a different event type?
        treeList.addListener("SelectedItemChanged", function (event) {
            var e = {type: "SelectedFileChanged", selectedItem: event.data};
            ftv.fire(e);
        }).addListener("Rename", function (event) {
            treeList.createNodeEditor(event.data, function (node, oldPath) {
                var f = project.getProjectFile(oldPath);
                if (event.data.isDirectory) {
                    project.renameFolder(oldPath, node.path, function (err, res) {
                        if (err) {
                            // alert user
                            if (err.code === "ENOTEMPTY") {
                                alert("Error: the folder could not be renamed into " + err.newPath + " (another folder with the same name already exists). Please choose a different name");
                            } else { alert(err.code); }
                            // revert to previous name
                            var prevData = event.data;
                            prevData.path = err.oldPath;
                            prevData.name = err.oldPath.substring(err.oldPath.lastIndexOf("/") + 1);
                            treeList.createNodeEditor(prevData);
                            // and trigger blur event to remove the overlay node used for renaming
                            var x = treeList.blur();
                        } else {
                            // we need to update the path of all children
                            var projectFiles = project.getProjectFiles();
                            if (projectFiles) {
                                projectFiles.forEach(function (file) {
                                    file.path(file.path().replace(oldPath, node.path));
                                });
                            }
                            treeList.render(projectFiles);
                        }
                    });
                } else { project.renameFile(f, node.name); }
            });
        }).addListener("New File", function (event) {
            var name = (fileCounter === 0) ? unSavedFileName + ".pvs" : unSavedFileName + "_" + fileCounter + ".pvs";
            fileCounter++;
            // make sure that the path is relative to the project folder
            var path = event.data.path + "/" + name;
            var newFileData = {name: name, path: path };
            newFileData = treeList.addItem(newFileData, event.data);
            treeList.selectItem(newFileData.path);
            treeList.createNodeEditor(newFileData, function (node, oldPath) {
                var file = project.getProjectFile(oldPath);
                file.path(node.path);
                ws.writeFile({filePath: file.path(), fileContent: file.content()}, function (err, res) {
                    if (!err) {
                        //add the spec file to the project and supress the event so we dont create multiple files
                        console.log(res);
                    } else {
                        console.log(err);
                        if (err && err.code === "EEXIST") {
                            // alert user
                            alert("Error: file " + err.path +
                                  " could not be created (another file with the same name already exists). Please choose a different name");
                            // remove the created node from filetreeview
                            var enteredItem = treeList.getSelectedItem();
                            treeList.removeItemByID(enteredItem.id);
                        }
                    }
                });
            }, function (node) {
                treeList.removeItem(node.path);
            });
        }).addListener("New Folder", function (event) {
            var name = (folderCounter === 0) ? unSavedFolderName : unSavedFolderName + "_" + folderCounter;
            folderCounter++;
            // make sure that the path is relative to the project folder
            var path = event.data.path + "/" + name;
            var newFolderData = {name: name, path: path, children: [], isDirectory: true};
            newFolderData = treeList.addItem(newFolderData, event.data);
            treeList.selectItem(newFolderData.path);
            treeList.createNodeEditor(newFolderData, function (node) {
                ws.writeDirectory(node.path, function (err, res) {
                    if (!err) {
                        console.log(res);
                    } else { console.log(err); }
                });
            }, function (node) {
                treeList.removeItem(node.path);
            });
        }).addListener("Delete", function (event) {
            var path = event.data.path;
            if (path === project.name()) {
                alert("Cannot delete project root directory.");
                return;
            }
            QuestionForm.create({
                header: "Confirm Delete",
                question: "Are you sure you want to delete " + path + "?",
                buttons: ["Cancel", "Delete"]
            }).on("ok", function (e, view) {
                //send request to remove file using the wsmanager
                ws.send({type: "deleteFile", filePath: path}, function (err) {
                    if (!err) {
                        treeList.selectNext(path);
                        treeList.removeItem(path);
                        // we need to remove the file from pvsFileList too
                        var projectFiles = project.getProjectFiles(); 
                        var pf = projectFiles.filter(function (file) {
                            return file.path() === path;
                        });
                        if (pf && pf.length === 1) {
                            project.removeFile(pf);
                        } else {
                            if (pf.length > 1) {
                                alert("Error: Something is wrong, more than one file selected for deletion.");
                            } else { alert("Error: Something is wrong, a delete file command has been sent but the file to be deleted cannot be selected."); }
                        }
                    } else {
                        //show error
                        console.log(err);
                    }
                });
                view.remove();
            }).on("cancel", function (e, view) { view.remove(); });
        });

        //if there is a project add listener to changes to files etc
        if (project) {
            var _this = this;
            project.addListener("DirtyFlagChanged", function (event) {
                var file = event.file;
                //set file as dirty
                treeList.markDirty(file.path(), file.dirty());
            }).addListener("ProjectMainSpecFileChanged", function () {
               //change the main file class
                
            }).addListener("FileAdded", function (event) {
                //add the new file to the tree list data
                treeList.addItem({name: event.file.name(), path: event.file.path()});
            }).addListener("FileRemoved", function (event) {
                //delete the removed file from the tree list data
                ftv.deleteItem(event.file);
            });
        }
    }
    
    FileTreeView.prototype.fileExists = function (filepath) {
        return treeList.nodeExists(filepath);
    };
    
    FileTreeView.prototype.deleteItem = function (file) {
        var path = typeof file === "string" ? file : file.path();
        treeList.removeItem(path);
    };
    
    /**
        Gets the undlerying treeList object. This would be useful if a direct access to manipulating
        the data in the treeList node is needed. The following calls are available
        selectItem
        addItem
        removeItem
        renameItem
        getSelectedItem
    */
    FileTreeView.prototype.getTreeList = function () {
        return treeList;
    };
    /**
        selects the file passed
    */
    FileTreeView.prototype.selectItem = function (file) {
        var path = typeof file === "string" ? file : file.path();
        treeList.selectItem(path);
    };
    
    /**
     * Renames the selected file to the name specified
     * @param {string} newName The newName to give the file.
     */
    FileTreeView.prototype.renameSelected = function (newName) {
        treeList.renameItem(treeList.getSelectedItem(), newName);
    };

    /**
        Gets the selected file in the treeview
        @returns {String} The full path to the selected file
     */
    FileTreeView.prototype.getSelectedItem = function () {
        var res = treeList.getSelectedItem();
        return res ? res.path : undefined;
    };
    
    /**
     * Renames the project
     * @param {string} newName The new project name.
     */
    FileTreeView.prototype.renameProject = function (newProjectName) {
        treeList.renameRoot(newProjectName);
    };


    module.exports = FileTreeView;
});
