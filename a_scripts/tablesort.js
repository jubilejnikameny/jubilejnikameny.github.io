addEvent(window, "load", sortables_init);

var SORT_COLUMN_INDEX;

function trim(myText)
{
  if (myText != null)
  {
    while (myText.indexOf(". ") != -1 || myText.indexOf(": ") != -1 || myText.indexOf("\n") != -1)
    {
      myText = myText.replace(/\. /,".");
      myText = myText.replace(/\: /,".");
      myText = myText.replace(/\s /,"");
    }
  }
  return myText;
}

function sortables_init()
{
  if (!document.getElementsByTagName)
   return;
  tbls = document.getElementsByTagName("table");
  for (ti=0;ti<tbls.length;ti++)
  {
    thisTbl = tbls[ti];
    if (((' '+thisTbl.className+' ').indexOf("sortable") != -1) && (thisTbl.id))
    {
      ts_makeSortable(thisTbl);
    }
  }
}

function ts_makeSortable(table)
{
  if (table.rows && table.rows.length > 0)
  {
    var firstRow = table.rows[0];
  }
  if (!firstRow)
    return;
  var cell;
  var txt;
  for (var i=0;i<firstRow.cells.length;i++)
  {
    cell = firstRow.cells[i];
    if (cell.className != 'dontsort')
    {
      txt = ts_getInnerText(cell);
      cell.innerHTML = '<a href="#" class="sortheader" onclick="ts_resortTable(this); return false;">'+txt+'<span class="sortarrow"></span></a>';
    }
  }
}

function ts_getInnerText(el)
{
  if (typeof el == "string")
    return el;
  if (typeof el == "undefined")
    return el;
  if (el.innerText)
    return el.innerText;  //Not needed but it is faster
  var str = "";

  var cs = el.childNodes;
  var l = cs.length;
  for (var i = 0; i < l; i++)
  {
    switch (cs[i].nodeType)
    {
      case 1: //ELEMENT_NODE
        str += ts_getInnerText(cs[i]);
      break;
      case 3:  //TEXT_NODE
        str += cs[i].nodeValue;
      break;
    }
  }
  return str;
}

function findValidRowInColumn(table,column)
{
  var ir = 1;
  for (ir=1 ;ir < table.rows.length; ir++)
  {
    if (table.rows[ir].cells[column] != undefined && table.rows[ir].cells[column].className != 'dontsort' && ts_getInnerText(table.rows[ir].cells[column]).length > 0  && ts_getInnerText(table.rows[ir].cells[column]) != " ")
      return ir;
  }
  return 0;
}

function ts_resortTable(lnk)
{
  var span;
  for (var ci=0;ci<lnk.childNodes.length;ci++)
  {
    if (lnk.childNodes[ci].tagName && lnk.childNodes[ci].tagName.toLowerCase() == 'span') span = lnk.childNodes[ci];
  }
  var spantext = ts_getInnerText(span);
  var td = lnk.parentNode;
  var column = td.cellIndex;
  var table = getParent(td,'TABLE');
  
  if (table.rows.length <= 1)
    return;
  var vr = findValidRowInColumn(table,column);
  var itm = ts_getInnerText(table.rows[vr].cells[column]);

  if (itm.match(/^\d{1,2}[\/.\/-][ ]?\d{1,2}[\/.\/-][ ]?(\d{2}|\d{4})([ ]{0,3}\d{1,2}[:]{1}\d{1,2}([ ]{0}|[:]{1}\d{1,2}))?$/))
    sortfn = ts_sort_date;
  else if (itm.match(/^(([€L\$])|kč |Kč |KČ ){1}.*|.*(([€L\$])|kč |Kč |KČ ){1}$/))
    sortfn = ts_sort_currency;
  else if (itm.match(/^[\d\,]+$/))
    sortfn = ts_sort_numeric;
  else
    sortfn = ts_sort_caseinsensitive;

  SORT_COLUMN_INDEX = column;
  var firstRow = new Array();
  var newRows = new Array();
  var noSortRows = new Array();
  firstRow[0] = table.rows[0];
  var tableRowIndex = 1;
  var newRowIndex = 0;
  var noSortIndex = 0;
  while (tableRowIndex < table.rows.length)
  {
    if (!table.rows[tableRowIndex].className || (table.rows[tableRowIndex].className && (table.rows[tableRowIndex].className != 'dontsort')))
    {
      newRows[newRowIndex] = table.rows[tableRowIndex];
      newRowIndex++;
    }
    else
    {
      noSortRows[noSortIndex] = table.rows[tableRowIndex];
      noSortIndex++;
    }
    tableRowIndex++;
  }

  newRows.sort(sortfn);

  if (span.getAttribute("sortdir") == 'down')
  {
    ARROW = '&nbsp;&nbsp;&uarr;';
    newRows.reverse();
    span.setAttribute('sortdir','up');
  }
  else
  {
    ARROW = '&nbsp;&nbsp;&darr;';
    span.setAttribute('sortdir','down');
  }

  for (i=0;i<noSortRows.length;i++)
  {
    newRows[newRows.length] = noSortRows[i];
  }

  for (i=0;i<newRows.length;i++)
  {
    table.tBodies[0].appendChild(newRows[i]);
  }

  var allspans = document.getElementsByTagName("span");
  for (var ci=0;ci<allspans.length;ci++)
    if (allspans[ci].className == 'sortarrow')
      if (getParent(allspans[ci],"table") == getParent(lnk,"table"))
        allspans[ci].innerHTML = '';
  span.innerHTML = ARROW;
}

function getParent(el, pTagName)
{
  if (el == null)
    return null;
  else if (el.nodeType == 1 && el.tagName.toLowerCase() == pTagName.toLowerCase())
    return el;
  else
    return getParent(el.parentNode, pTagName);
}

function ts_sort_date(a,b)
{
  var aaDateTime;
  if (a.cells[SORT_COLUMN_INDEX] != undefined && a.cells[SORT_COLUMN_INDEX].className != 'dontsort' && ts_getInnerText(a.cells[SORT_COLUMN_INDEX]).length > 0  && ts_getInnerText(a.cells[SORT_COLUMN_INDEX]) != " ")
  {
    aa = ts_getInnerText(a.cells[SORT_COLUMN_INDEX]);
    var aaList = trim(aa).split(" ");
    var aaDateList;
    var aaTimeList;
    if (aaList[0].indexOf(".") != -1)
    {// první je datum

      aaDateList = aaList[0].split(".");

      if (aaList[1] != null && aaList[1].indexOf(":") != -1)
      { // rozbrakovat čas
        aaTimeList = aaList[1].split(":");
        if (aaTimeList.length > 2)
          aaDateTime = new Date(aaDateList[2],(aaDateList[1]-1),aaDateList[0],aaTimeList[0],aaTimeList[1],aaTimeList[2]);
        else
          aaDateTime = new Date(aaDateList[2],(aaDateList[1]-1),aaDateList[0],aaTimeList[0],aaTimeList[1],0);
      }
      else
      { // jenom datum
        aaDateTime = new Date(aaDateList[2],(aaDateList[1]-1),aaDateList[0]);
      }
    }
    else
    { // první je čas
      aaTimeList = aaList[1].split(":");
      aaDateList = aaList[0].split(".");
      if (aaTimeList.length > 2)
        aaDateTime = new Date(aaDateList[2],(aaDateList[1]-1),aaDateList[0],aaTimeList[0],aaTimeList[1],aaTimeList[2]);
      else
        aaDateTime = new Date(aaDateList[2],(aaDateList[1]-1),aaDateList[0],aaTimeList[0],aaTimeList[1],0);
    }
  }
  else
    aaDateTime = new Date(1900,0,1);

  var bbDateTime;
  if (b.cells[SORT_COLUMN_INDEX] != undefined && b.cells[SORT_COLUMN_INDEX].className != 'dontsort' && ts_getInnerText(b.cells[SORT_COLUMN_INDEX]).length > 0  && ts_getInnerText(b.cells[SORT_COLUMN_INDEX]) != " ")
  {
    bb = ts_getInnerText(b.cells[SORT_COLUMN_INDEX]);
    var bbList = trim(bb).split(" ");
    var bbDateList;
    var bbTimeList;

    if (bbList[0].indexOf(".") != -1)
    {// první je datum
      bbDateList = bbList[0].split(".");
      if (bbList[1] != null && bbList[1].indexOf(":") != -1)
      { // rozbrakovat čas
        bbTimeList = bbList[1].split(":");
        if (bbTimeList.length > 2)
          bbDateTime = new Date(bbDateList[2],(bbDateList[1]-1),bbDateList[0],bbTimeList[0],bbTimeList[1],bbTimeList[2]);
        else
          bbDateTime = new Date(bbDateList[2],(bbDateList[1]-1),bbDateList[0],bbTimeList[0],bbTimeList[1],0);
      }
      else
      { // jenom datum
        bbDateTime = new Date(bbDateList[2],(bbDateList[1]-1),bbDateList[0]);
      }
    }
    else
    { // první je čas
      bbTimeList = bbList[1].split(":");
      bbDateList = bbList[0].split(".");
      if (bbTimeList.length > 2)
        bbDateTime = new Date(bbDateList[2],(bbDateList[1]-1),bbDateList[0],bbTimeList[0],bbTimeList[1],bbTimeList[2]);
      else
        bbDateTime = new Date(bbDateList[2],(bbDateList[1]-1),bbDateList[0],bbTimeList[0],bbTimeList[1],0);
    }
  }
  else
    bbDateTime = new Date(1900,0,1);

  if (aaDateTime == bbDateTime)
    return 0;
  else if (aaDateTime < bbDateTime)
    return -1;
  else
    return 1;
}

function ts_sort_currency(a,b)
{
  aa = ts_getInnerText(a.cells[SORT_COLUMN_INDEX]).replace(/[^0-9.]/g,'');
  bb = ts_getInnerText(b.cells[SORT_COLUMN_INDEX]).replace(/[^0-9.]/g,'');
  return parseFloat(aa) - parseFloat(bb);
}

function ts_sort_numeric(a,b)
{
  if (a.cells[SORT_COLUMN_INDEX] != undefined && a.cells[SORT_COLUMN_INDEX].className != 'dontsort' && ts_getInnerText(a.cells[SORT_COLUMN_INDEX]).length > 0  && ts_getInnerText(a.cells[SORT_COLUMN_INDEX]) != " ")
    aa = parseFloat(ts_getInnerText(a.cells[SORT_COLUMN_INDEX]));
  else
    aa = 0;
  if (b.cells[SORT_COLUMN_INDEX] != undefined && b.cells[SORT_COLUMN_INDEX].className != 'dontsort' && ts_getInnerText(b.cells[SORT_COLUMN_INDEX]).length > 0  && ts_getInnerText(b.cells[SORT_COLUMN_INDEX]) != " ")
    bb = parseFloat(ts_getInnerText(b.cells[SORT_COLUMN_INDEX]));
  else
    bb = 0;
  return aa-bb;
}

function char2Diacritic(transDiacritic)
{
  var charDiacritic = "ÁČĎÉÍĹĽŇÓÔŔŘŠŤÚŮÝŽ";
  var numDiacritic = "ACDEILLNOORRSTUUYZ";
  var tmpDiacritic = "";
  var newDiacritic = "";
  transDiacritic = transDiacritic.toUpperCase();
  for(i=0;i<transDiacritic.length;i++)
  {
    if (charDiacritic.indexOf(transDiacritic.charAt(i))!=-1)
      tmpDiacritic += numDiacritic.charAt(charDiacritic.indexOf(transDiacritic.charAt(i)))+'|';
    else
     tmpDiacritic += transDiacritic.charAt(i);
  }
  return tmpDiacritic;
}

function ts_sort_caseinsensitive(a,b)
{
  var aa = "_";
  var bb = "_";
  if (a.cells[SORT_COLUMN_INDEX] != undefined && a.cells[SORT_COLUMN_INDEX].className != 'dontsort' && ts_getInnerText(a.cells[SORT_COLUMN_INDEX]).length > 0)
    aa = char2Diacritic(ts_getInnerText(a.cells[SORT_COLUMN_INDEX]));
  if (b.cells[SORT_COLUMN_INDEX] != undefined && b.cells[SORT_COLUMN_INDEX].className != 'dontsort' && ts_getInnerText(b.cells[SORT_COLUMN_INDEX]).length > 0)
    bb = char2Diacritic(ts_getInnerText(b.cells[SORT_COLUMN_INDEX]));
  if (aa==bb)
    return 0;
  else if (aa < bb)
    return -1;
  else
    return 1;
}

function ts_sort_default(a,b)
{
  aa = ts_getInnerText(a.cells[SORT_COLUMN_INDEX]);
  bb = ts_getInnerText(b.cells[SORT_COLUMN_INDEX]);
  if (aa==bb)
    return 0;
  else if (aa<bb)
    return -1;
  else
    return 1;
}

function addEvent(elm, evType, fn, useCapture)
{
  if (elm.addEventListener)
  {
    elm.addEventListener(evType, fn, useCapture);
    return true;
  }
  else if (elm.attachEvent)
  {
    var r = elm.attachEvent("on"+evType, fn);
    return r;
  }
  else
  {
    alert("Handler could not be removed");
  }
}
